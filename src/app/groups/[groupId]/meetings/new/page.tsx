"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("OFFLINE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/groups/${groupId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, date, location, type }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    const meeting = await res.json();
    router.push(`/groups/${groupId}/meetings/${meeting.id}`);
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
              모임 제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="예: 제5회 정기 모임"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              placeholder="이번 모임에서 다룰 내용"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              날짜 및 시간 *
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모임 유형
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="OFFLINE"
                  checked={type === "OFFLINE"}
                  onChange={(e) => setType(e.target.value)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">오프라인</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="ONLINE"
                  checked={type === "ONLINE"}
                  onChange={(e) => setType(e.target.value)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">온라인</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === "OFFLINE" ? "장소" : "온라인 링크"}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder={
                type === "OFFLINE"
                  ? "예: 강남역 스타벅스"
                  : "예: Zoom 링크"
              }
            />
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
