"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import VoiceRecorder from "@/components/synaps/VoiceRecorder";
import ExtractingOverlay from "@/components/synaps/ExtractingOverlay";

interface Note {
  id: string;
  content: string;
  type: string;
  createdAt: string;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const meetingId = params.meetingId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("NOTE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/meetings/${meetingId}/notes`)
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [groupId, meetingId]);

  // 노트 저장 (추출 없이)
  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSaving(true);

    const res = await fetch(
      `/api/groups/${groupId}/meetings/${meetingId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote, type: noteType }),
      }
    );

    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [...prev, note]);
      setNewNote("");
    }
    setSaving(false);
  }

  // 노트 저장 + 인사이트 추출
  async function addNoteAndExtract() {
    if (!newNote.trim() || newNote.trim().length < 10) return;
    setSaving(true);
    setExtracting(true);
    setExtractedCount(null);

    // 1. 노트 저장
    const noteRes = await fetch(
      `/api/groups/${groupId}/meetings/${meetingId}/notes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote, type: noteType }),
      }
    );

    if (noteRes.ok) {
      const note = await noteRes.json();
      setNotes((prev) => [...prev, note]);
    }

    // 2. 인사이트 추출
    const extractRes = await fetch(`/api/groups/${groupId}/synaps/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newNote, source: "NOTE", meetingId }),
    });

    if (extractRes.ok) {
      const data = await extractRes.json();
      setExtractedCount(data.count);
    }

    setNewNote("");
    setSaving(false);
    setExtracting(false);
  }

  // 기존 노트에서 인사이트 추출
  async function extractFromNote(note: Note) {
    if (note.content.trim().length < 10) return;
    setExtracting(true);
    setExtractedCount(null);

    const res = await fetch(`/api/groups/${groupId}/synaps/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: note.content, source: "NOTE", meetingId }),
    });

    if (res.ok) {
      const data = await res.json();
      setExtractedCount(data.count);
    }

    setExtracting(false);
  }

  // 음성 녹음 → synap 추출
  async function handleTranscript(text: string, duration: number) {
    setExtracting(true);
    setExtractedCount(null);

    await fetch(`/api/groups/${groupId}/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, duration, meetingId }),
    });

    const res = await fetch(`/api/groups/${groupId}/synaps/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: "VOICE", meetingId }),
    });

    if (res.ok) {
      const data = await res.json();
      setExtractedCount(data.count);
    }

    await fetch(`/api/groups/${groupId}/meetings/${meetingId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text, type: "NOTE" }),
    });

    setExtracting(false);
  }

  const typeLabel: Record<string, string> = {
    NOTE: "메모",
    QUOTE: "인용",
    KEY_POINT: "핵심 포인트",
    ACTION_ITEM: "실행 항목",
  };

  const typeColor: Record<string, string> = {
    NOTE: "bg-gray-100 text-gray-700",
    QUOTE: "bg-purple-100 text-purple-700",
    KEY_POINT: "bg-amber-100 text-amber-700",
    ACTION_ITEM: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/groups/${groupId}`}
        className="text-sm text-gray-400 hover:text-gray-600 transition"
      >
        &larr; 그룹으로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2 mt-2">모임 기록</h1>
      <p className="text-gray-500 mb-6">
        모임 중 나온 대화, 인사이트, 실행 항목을 기록하세요.
      </p>

      {/* 음성 녹음 섹션 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          음성으로 기록하기
        </h2>
        <VoiceRecorder groupId={groupId} meetingId={meetingId} onTranscriptReady={handleTranscript} disabled={extracting} />
      </div>

      {/* 추출 결과 알림 */}
      {extractedCount !== null && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm text-green-800">
            {extractedCount}개의 Synap이 추출되었습니다!
          </p>
          <Link
            href={`/groups/${groupId}/synaps`}
            className="text-sm text-green-700 font-medium hover:underline"
          >
            Synap Board에서 보기 &rarr;
          </Link>
        </div>
      )}

      {/* 직접 기록하기 폼 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          직접 기록하기
        </h2>
        <form onSubmit={addNote} className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(typeLabel).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setNoteType(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  noteType === value
                    ? typeColor[value]
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
            placeholder="모임에서 나온 이야기를 기록하세요..."
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !newNote.trim()}
              className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
            >
              {saving ? "저장 중..." : "기록만 추가"}
            </button>
            <button
              type="button"
              onClick={addNoteAndExtract}
              disabled={saving || !newNote.trim() || newNote.trim().length < 10}
              className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              기록 + 인사이트 추출
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      {loading ? (
        <p className="text-gray-500 text-center py-8">로딩 중...</p>
      ) : notes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          아직 기록이 없습니다. 위에서 첫 기록을 추가해보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-5 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      typeColor[note.type] || typeColor.NOTE
                    }`}
                  >
                    {typeLabel[note.type] || note.type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleTimeString("ko-KR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {note.content.length >= 10 && (
                  <button
                    onClick={() => extractFromNote(note)}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    인사이트 추출
                  </button>
                )}
              </div>
              <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 추출 오버레이 */}
      {extracting && <ExtractingOverlay />}
    </div>
  );
}
