"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    { value: "GENERAL", label: "자유" },
    { value: "BOOK_REVIEW", label: "서평" },
    { value: "QUESTION", label: "질문" },
    { value: "RECOMMENDATION", label: "추천" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/groups/${groupId}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      setLoading(false);
      return;
    }

    router.push(`/groups/${groupId}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">새 토론 시작</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리
            </label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    category === cat.value
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="토론 주제를 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내용 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              placeholder="토론 내용을 자유롭게 작성하세요"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {loading ? "등록 중..." : "토론 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
