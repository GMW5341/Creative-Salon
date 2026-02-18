"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGroupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(20);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, maxMembers, isPublic }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    const group = await res.json();
    router.push(`/groups/${group.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">새 모임 만들기</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모임 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="예: 수요 독서 모임"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모임 소개
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              placeholder="모임에 대해 소개해주세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              최대 인원
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              min={2}
              max={100}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              공개 모임으로 설정 (누구나 검색 가능)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {loading ? "생성 중..." : "모임 만들기"}
          </button>
        </form>
      </div>
    </div>
  );
}
