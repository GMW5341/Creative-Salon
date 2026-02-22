"use client";

import { useState } from "react";

interface SynapData {
  id: string;
  content: string;
  summary: string;
  tags: string | null;
  source: string;
  createdAt: string;
  author: { id: string; name: string; profileImage: string | null };
  meeting?: { id: string; title: string; date: string } | null;
  discussion?: { id: string; title: string } | null;
  connectionsFrom?: Array<{
    id: string;
    insight: string;
    toSynap: { id: string; summary: string; tags: string | null };
    author: { name: string };
  }>;
  connectionsTo?: Array<{
    id: string;
    insight: string;
    fromSynap: { id: string; summary: string; tags: string | null };
    author: { name: string };
  }>;
}

interface SynapDetailModalProps {
  synap: SynapData;
  groupId: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (updated: any) => void;
  onDelete: (id: string) => void;
}

export default function SynapDetailModal({
  synap,
  groupId,
  onClose,
  onUpdate,
  onDelete,
}: SynapDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(synap.content);
  const [editSummary, setEditSummary] = useState(synap.summary);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const tags: string[] = synap.tags ? JSON.parse(synap.tags) : [];
  const connections = [
    ...(synap.connectionsFrom || []).map((c) => ({
      id: c.id,
      insight: c.insight,
      linkedSummary: c.toSynap.summary,
      author: c.author.name,
    })),
    ...(synap.connectionsTo || []).map((c) => ({
      id: c.id,
      insight: c.insight,
      linkedSummary: c.fromSynap.summary,
      author: c.author.name,
    })),
  ];

  const sourceLabel: Record<string, string> = {
    MANUAL: "직접 작성",
    VOICE: "음성 기록",
    NOTE: "모임 노트",
    DISCUSSION: "토론",
  };

  const sourceColor: Record<string, string> = {
    MANUAL: "bg-gray-100 text-gray-600",
    VOICE: "bg-violet-100 text-violet-700",
    NOTE: "bg-amber-100 text-amber-700",
    DISCUSSION: "bg-blue-100 text-blue-700",
  };

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/groups/${groupId}/synaps/${synap.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent, summary: editSummary }),
    });

    if (res.ok) {
      const updated = await res.json();
      onUpdate(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleDelete() {
    const res = await fetch(`/api/groups/${groupId}/synaps/${synap.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      onDelete(synap.id);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                sourceColor[synap.source] || sourceColor.MANUAL
              }`}
            >
              {sourceLabel[synap.source] || synap.source}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(synap.createdAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {editing ? (
            /* 수정 모드 */
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">요약</label>
                <input
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">원문</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditContent(synap.content);
                    setEditSummary(synap.summary);
                  }}
                  className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            /* 상세 보기 */
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{synap.summary}</h2>
                {synap.content !== synap.summary && (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {synap.content}
                  </p>
                )}
              </div>

              {/* 태그 */}
              {tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 출처 정보 */}
              {(synap.meeting || synap.discussion) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  {synap.meeting && (
                    <p className="text-xs text-gray-500">
                      모임: <span className="text-gray-700">{synap.meeting.title}</span>
                    </p>
                  )}
                  {synap.discussion && (
                    <p className="text-xs text-gray-500">
                      토론: <span className="text-gray-700">{synap.discussion.title}</span>
                    </p>
                  )}
                </div>
              )}

              {/* 연결 */}
              {connections.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">연결된 Synap</p>
                  <div className="space-y-2">
                    {connections.map((conn) => (
                      <div key={conn.id} className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                        <p className="text-sm font-medium text-gray-800">{conn.linkedSummary}</p>
                        <p className="text-xs text-violet-600 mt-1">{conn.insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 작성자 */}
              <p className="text-xs text-gray-400">{synap.author.name}</p>
            </>
          )}
        </div>

        {/* 하단 액션 */}
        {!editing && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              수정
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">정말 삭제?</span>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 font-medium hover:text-red-700"
                >
                  삭제
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-400 hover:text-red-600 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
