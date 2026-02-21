"use client";

import { useState, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface VoiceRecorderProps {
  groupId: string;
  meetingId?: string;
  onTranscriptReady: (text: string, duration: number) => void;
  disabled?: boolean;
}

type RecordMode = "browser" | "upload";

export default function VoiceRecorder({
  groupId,
  meetingId,
  onTranscriptReady,
  disabled,
}: VoiceRecorderProps) {
  const [mode, setMode] = useState<RecordMode>("browser");

  // ─── 브라우저 STT 상태 ───
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // ─── 녹음 (MediaRecorder) 상태 ───
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isMediaRecording, setIsMediaRecording] = useState(false);
  const [mediaDuration, setMediaDuration] = useState(0);
  const mediaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStartRef = useRef<number>(0);

  // ─── 파일 업로드 상태 ───
  const [uploading, setUploading] = useState(false);
  const [uploadTranscript, setUploadTranscript] = useState("");

  const isBrowserSTTSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ════════════════════════════════════
  // 방법 1: 브라우저 실시간 STT
  // ════════════════════════════════════

  function stopBrowserRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setInterim("");
  }

  function startBrowserRecording() {
    if (!isBrowserSTTSupported) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let lastProcessedIndex = 0;

    recognition.onresult = (event: any) => {
      let newFinalText = "";
      let interimText = "";
      for (let i = lastProcessedIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinalText += result[0].transcript + " ";
          lastProcessedIndex = i + 1;
        } else {
          interimText += result[0].transcript;
        }
      }
      if (newFinalText) setTranscript((prev) => prev + newFinalText);
      setInterim(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("음성 인식 오류:", event.error);
      if (event.error !== "no-speech") stopBrowserRecording();
    };

    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setInterim("");
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  // ════════════════════════════════════
  // 방법 2: 마이크 녹음 → Whisper API
  // ════════════════════════════════════

  async function startMediaRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendToWhisper(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsMediaRecording(true);
      mediaStartRef.current = Date.now();
      mediaTimerRef.current = setInterval(() => {
        setMediaDuration(Math.floor((Date.now() - mediaStartRef.current) / 1000));
      }, 1000);
    } catch (err) {
      console.error("마이크 접근 실패:", err);
      alert("마이크 권한을 허용해주세요.");
    }
  }

  function stopMediaRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaTimerRef.current) clearInterval(mediaTimerRef.current);
    setIsMediaRecording(false);
  }

  async function sendToWhisper(blob: Blob) {
    setUploading(true);
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    if (meetingId) formData.append("meetingId", meetingId);

    try {
      const res = await fetch(`/api/groups/${groupId}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadTranscript(data.transcript);
      } else {
        const err = await res.json();
        if (err.fallbackToLocal) {
          alert("Whisper API 키가 설정되지 않았습니다. 브라우저 음성 인식을 사용해주세요.");
          setMode("browser");
        } else {
          alert(err.error || "음성 변환에 실패했습니다.");
        }
      }
    } catch (e) {
      console.error("업로드 실패:", e);
    }
    setUploading(false);
  }

  // ─── 파일 직접 업로드 ───
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("audio", file);
    if (meetingId) formData.append("meetingId", meetingId);

    try {
      const res = await fetch(`/api/groups/${groupId}/voice/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadTranscript(data.transcript);
      } else {
        const err = await res.json();
        alert(err.error || "음성 변환에 실패했습니다.");
      }
    } catch (err) {
      console.error("파일 업로드 실패:", err);
    }
    setUploading(false);
    e.target.value = "";
  }

  // ─── 공통 ───
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentTranscript = mode === "browser" ? transcript : uploadTranscript;
  const isActive = isRecording || isMediaRecording || uploading;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      {/* 모드 선택 */}
      <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit">
        <button
          onClick={() => setMode("browser")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            mode === "browser"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          실시간 인식
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
            mode === "upload"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          녹음 / 파일 업로드
        </button>
      </div>

      {/* ─── 실시간 브라우저 STT ─── */}
      {mode === "browser" && (
        <>
          {!isBrowserSTTSupported ? (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
              이 브라우저에서는 실시간 음성 인식이 지원되지 않습니다. Chrome을 사용하거나 &lsquo;녹음 / 파일 업로드&rsquo; 모드를 사용해주세요.
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={isRecording ? stopBrowserRecording : startBrowserRecording}
                disabled={disabled}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 animate-pulse"
                    : "bg-amber-600 hover:bg-amber-700"
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {isRecording ? "인식 중..." : "실시간 음성 인식"}
                  </span>
                  {isRecording && (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-500 font-mono">{formatTime(duration)}</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400">마이크 버튼을 누르면 브라우저가 음성을 실시간으로 텍스트로 변환합니다</p>
              </div>
            </div>
          )}

          {(transcript || interim) && (
            <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {transcript}
                {interim && <span className="text-gray-400">{interim}</span>}
              </p>
            </div>
          )}
        </>
      )}

      {/* ─── 녹음 + Whisper API ─── */}
      {mode === "upload" && (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={isMediaRecording ? stopMediaRecording : startMediaRecording}
              disabled={disabled || uploading}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMediaRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-violet-600 hover:bg-violet-700"
              } disabled:opacity-50`}
            >
              {isMediaRecording ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {isMediaRecording
                    ? "녹음 중..."
                    : uploading
                    ? "Whisper API로 변환 중..."
                    : "녹음하여 AI가 변환"}
                </span>
                {isMediaRecording && (
                  <>
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-500 font-mono">{formatTime(mediaDuration)}</span>
                  </>
                )}
                {uploading && (
                  <svg className="w-4 h-4 animate-spin text-violet-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-400">녹음 후 OpenAI Whisper가 고품질 한국어 변환을 수행합니다</p>
            </div>
          </div>

          {/* 파일 업로드 */}
          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                  음성 파일 업로드
                </span>
                <p className="text-xs text-gray-400">mp3, wav, webm, m4a 지원</p>
              </div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading || isMediaRecording}
              />
            </label>
          </div>

          {uploadTranscript && (
            <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{uploadTranscript}</p>
            </div>
          )}
        </>
      )}

      {/* ─── 제출 버튼 ─── */}
      {currentTranscript && !isActive && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              onTranscriptReady(currentTranscript.trim(), mode === "browser" ? duration : mediaDuration);
              setTranscript("");
              setUploadTranscript("");
              setDuration(0);
              setMediaDuration(0);
            }}
            className="bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition flex-1"
          >
            이 대화에서 dot 추출하기
          </button>
          <button
            onClick={() => {
              setTranscript("");
              setUploadTranscript("");
              setDuration(0);
              setMediaDuration(0);
            }}
            className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
