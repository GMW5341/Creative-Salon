"use client";

import { useState, useRef } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface VoiceRecorderProps {
  onTranscript: (text: string, duration: number) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [duration, setDuration] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
    setInterim("");
  }

  function startRecording() {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterim(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("음성 인식 오류:", event.error);
      if (event.error !== "no-speech") {
        stopRecording();
      }
    };

    recognition.onend = () => {
      // continuous 모드에서 자동 재시작
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // already started
        }
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

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim(), duration);
      setTranscript("");
      setDuration(0);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-500">
        이 브라우저에서는 음성 인식이 지원되지 않습니다. Chrome 브라우저를 사용해주세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* 녹음 컨트롤 */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
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

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {isRecording ? "녹음 중..." : "음성으로 대화를 기록하세요"}
            </span>
            {isRecording && (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-500 font-mono">
                  {formatTime(duration)}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            마이크 버튼을 눌러 대화를 시작하세요
          </p>
        </div>
      </div>

      {/* 실시간 텍스트 표시 */}
      {(transcript || interim) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {transcript}
            {interim && (
              <span className="text-gray-400">{interim}</span>
            )}
          </p>
        </div>
      )}

      {/* 제출 버튼 */}
      {transcript && !isRecording && (
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition flex-1"
          >
            이 대화에서 dot 추출하기
          </button>
          <button
            onClick={() => {
              setTranscript("");
              setDuration(0);
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
