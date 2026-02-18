"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch(`/api/groups/${groupId}/meetings/${meetingId}/notes`)
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, [groupId, meetingId]);

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
      setNotes([...notes, note]);
      setNewNote("");
    }
    setSaving(false);
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">모임 기록</h1>
      <p className="text-gray-500 mb-8">
        모임 중 나온 대화, 인사이트, 실행 항목을 기록하세요.
      </p>

      {/* Add Note Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
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
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
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
              <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
