"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import VoiceRecorder from "@/components/synaps/VoiceRecorder";
import ExtractingOverlay from "@/components/synaps/ExtractingOverlay";
import ThoughtBrancher from "@/components/synaps/ThoughtBrancher";

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

  // 노트 수정/삭제 상태
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("NOTE");
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/meetings/${meetingId}/notes`)
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [groupId, meetingId]);

  // 노트 저장
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

  // 노트 수정
  async function handleUpdateNote(noteId: string) {
    setEditSaving(true);
    const res = await fetch(
      `/api/groups/${groupId}/meetings/${meetingId}/notes/${noteId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, type: editType }),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingNoteId(null);
    }
    setEditSaving(false);
  }

  // 노트 삭제
  async function handleDeleteNote(noteId: string) {
    const res = await fetch(
      `/api/groups/${groupId}/meetings/${meetingId}/notes/${noteId}`,
      { method: "DELETE" }
    );

    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setConfirmDeleteId(null);
    }
  }

  // 수정 모드 시작
  function startEdit(note: Note) {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditType(note.type);
    setConfirmDeleteId(null);
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
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
          <button
            type="submit"
            disabled={saving || !newNote.trim()}
            className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {saving ? "저장 중..." : "기록 추가"}
          </button>
        </form>
      </div>

      {/* 텍스트에서 생각 가져가기 */}
      <div className="mb-8">
        <ThoughtBrancher
          groupId={groupId}
          meetingId={meetingId}
          onSynapCreated={() => {
            setExtractedCount((prev) => (prev ?? 0) + 1);
          }}
        />
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
          <h2 className="text-sm font-semibold text-gray-900">
            기록 ({notes.length})
          </h2>
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-5 group"
            >
              {editingNoteId === note.id ? (
                /* 수정 모드 */
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(typeLabel).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setEditType(value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          editType === value
                            ? typeColor[value]
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={editSaving || !editContent.trim()}
                      className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      {editSaving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                /* 보기 모드 */
                <>
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
                    {/* 수정/삭제 버튼 (hover로 보이기) */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        수정
                      </button>
                      {confirmDeleteId === note.id ? (
                        <span className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-xs text-red-500 font-medium hover:text-red-600"
                          >
                            삭제 확인
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            취소
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(note.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추출 오버레이 */}
      {extracting && <ExtractingOverlay />}
    </div>
  );
}
