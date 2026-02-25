"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import ParticleLoader from "@/components/ParticleLoader";

interface PersonalNote {
  id: string;
  content: string;
  title: string | null;
  type: string;
  tags: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

type NoteType = "ALL" | "MEMO" | "WRITING" | "QUOTE" | "IDEA" | "REFLECTION" | "QUESTION";

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  MEMO: { label: "메모", color: "bg-gray-100 text-gray-600", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  WRITING: { label: "글", color: "bg-amber-100 text-amber-700", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
  QUOTE: { label: "인용", color: "bg-purple-100 text-purple-700", icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" },
  IDEA: { label: "아이디어", color: "bg-yellow-100 text-yellow-700", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  REFLECTION: { label: "성찰", color: "bg-blue-100 text-blue-700", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  QUESTION: { label: "질문", color: "bg-green-100 text-green-700", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export default function MyBrainPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<NoteType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // 작성 상태
  const [showWriter, setShowWriter] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [writeTitle, setWriteTitle] = useState("");
  const [writeType, setWriteType] = useState<string>("MEMO");
  const [saving, setSaving] = useState(false);

  // 수정/삭제 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 확장된 노트
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType !== "ALL") params.set("type", filterType);
    if (searchQuery) params.set("q", searchQuery);

    const res = await fetch(`/api/my/notes?${params}`);
    if (res.ok) setNotes(await res.json());
  }, [filterType, searchQuery]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchNotes().finally(() => setLoading(false));
    }
  }, [status, router, fetchNotes]);

  // 새 노트 저장
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!writeContent.trim()) return;
    setSaving(true);

    const res = await fetch("/api/my/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: writeContent,
        title: writeTitle || null,
        type: writeType,
      }),
    });

    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setWriteContent("");
      setWriteTitle("");
      setWriteType("MEMO");
      setShowWriter(false);
    }
    setSaving(false);
  }

  // 노트 수정
  async function handleUpdate(noteId: string) {
    setEditSaving(true);
    const res = await fetch(`/api/my/notes/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: editContent,
        title: editTitle || null,
        type: editType,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingId(null);
    }
    setEditSaving(false);
  }

  // 노트 삭제
  async function handleDelete(noteId: string) {
    const res = await fetch(`/api/my/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setConfirmDeleteId(null);
    }
  }

  // 핀 토글
  async function handleTogglePin(note: PersonalNote) {
    const res = await fetch(`/api/my/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });

    if (res.ok) {
      const updated = await res.json();
      setNotes((prev) =>
        prev
          .map((n) => (n.id === note.id ? updated : n))
          .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
      );
    }
  }

  // 수정 시작
  function startEdit(note: PersonalNote) {
    setEditingId(note.id);
    setEditContent(note.content);
    setEditTitle(note.title || "");
    setEditType(note.type);
    setExpandedId(null);
  }

  // 통계
  const stats = {
    total: notes.length,
    today: notes.filter(
      (n) => new Date(n.createdAt).toDateString() === new Date().toDateString()
    ).length,
  };

  if (status === "loading" || loading) {
    return <ParticleLoader />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">나의 뇌</h1>
            <p className="text-sm text-gray-400 mt-1">
              {session?.user?.name}의 생각 저장소
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            모임 보기 &rarr;
          </Link>
        </div>

        {/* 간단한 통계 */}
        <div className="flex gap-4 mt-4">
          <div className="bg-amber-50 rounded-lg px-4 py-2">
            <p className="text-2xl font-bold text-amber-700">{stats.total}</p>
            <p className="text-xs text-amber-600">전체 기록</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2">
            <p className="text-2xl font-bold text-gray-700">{stats.today}</p>
            <p className="text-xs text-gray-500">오늘</p>
          </div>
        </div>
      </div>

      {/* 작성 버튼 / 폼 */}
      {!showWriter ? (
        <button
          onClick={() => setShowWriter(true)}
          className="w-full bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 text-left hover:border-amber-300 transition group mb-6"
        >
          <p className="text-gray-400 group-hover:text-amber-600 transition">
            지금 떠오르는 생각을 적어보세요...
          </p>
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 space-y-4"
        >
          {/* 타입 선택 */}
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(typeConfig).map(([value, config]) => (
              <button
                key={value}
                type="button"
                onClick={() => setWriteType(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  writeType === value
                    ? config.color
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* 제목 (선택) */}
          {(writeType === "WRITING" || writeType === "REFLECTION" || writeTitle) && (
            <input
              value={writeTitle}
              onChange={(e) => setWriteTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="제목 (선택)"
            />
          )}

          {/* 본문 */}
          <textarea
            value={writeContent}
            onChange={(e) => setWriteContent(e.target.value)}
            rows={writeType === "WRITING" || writeType === "REFLECTION" ? 8 : 3}
            autoFocus
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none leading-relaxed"
            placeholder={
              writeType === "MEMO" ? "떠오르는 생각을 자유롭게..." :
              writeType === "WRITING" ? "글을 써보세요..." :
              writeType === "QUOTE" ? "기억하고 싶은 문장을 적어보세요..." :
              writeType === "IDEA" ? "아이디어를 기록하세요..." :
              writeType === "REFLECTION" ? "오늘의 나를 돌아보며..." :
              "궁금한 것을 적어보세요..."
            }
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !writeContent.trim()}
              className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWriter(false);
                setWriteContent("");
                setWriteTitle("");
              }}
              className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 검색 + 필터 */}
      <div className="flex gap-3 mb-4 items-center">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            placeholder="내 기록 검색..."
          />
        </div>
      </div>

      {/* 타입 필터 */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        <button
          onClick={() => setFilterType("ALL")}
          className={`text-xs px-2.5 py-1 rounded-full transition ${
            filterType === "ALL"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          전체
        </button>
        {Object.entries(typeConfig).map(([value, config]) => (
          <button
            key={value}
            onClick={() => setFilterType(value as NoteType)}
            className={`text-xs px-2.5 py-1 rounded-full transition ${
              filterType === value
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* 노트 목록 */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            아직 기록이 없어요
          </h2>
          <p className="text-sm text-gray-400">
            떠오르는 생각, 읽은 문장, 궁금한 것들을 여기에 모아보세요.
            <br />
            이곳이 당신의 뇌가 됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const config = typeConfig[note.type] || typeConfig.MEMO;
            const tags: string[] = note.tags ? JSON.parse(note.tags) : [];
            const isExpanded = expandedId === note.id;
            const isLong = note.content.length > 200;

            if (editingId === note.id) {
              return (
                <div
                  key={note.id}
                  className="bg-white rounded-xl border border-amber-200 p-5 space-y-3"
                >
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(typeConfig).map(([value, c]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setEditType(value)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          editType === value
                            ? c.color
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="제목 (선택)"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      disabled={editSaving || !editContent.trim()}
                      className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      {editSaving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={note.id}
                className="bg-white rounded-xl border border-gray-200 p-5 group hover:border-gray-300 transition"
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {note.isPinned && (
                      <span className="text-amber-500 text-xs">pinned</span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(note.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" "}
                      {new Date(note.createdAt).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className={`text-xs px-1.5 py-0.5 rounded transition ${
                        note.isPinned
                          ? "text-amber-600 hover:text-amber-700"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={note.isPinned ? "고정 해제" : "상단 고정"}
                    >
                      pin
                    </button>
                    <button
                      onClick={() => startEdit(note)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      수정
                    </button>
                    {confirmDeleteId === note.id ? (
                      <span className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="text-xs text-red-500 font-medium"
                        >
                          확인
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-gray-400"
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

                {/* 제목 */}
                {note.title && (
                  <h3 className="font-semibold text-gray-900 mb-1">{note.title}</h3>
                )}

                {/* 본문 */}
                <p
                  className={`text-sm text-gray-700 whitespace-pre-wrap leading-relaxed ${
                    !isExpanded && isLong ? "line-clamp-4" : ""
                  }`}
                >
                  {note.content}
                </p>

                {isLong && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : note.id)}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1 font-medium"
                  >
                    {isExpanded ? "접기" : "더 보기"}
                  </button>
                )}

                {/* 태그 */}
                {tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
