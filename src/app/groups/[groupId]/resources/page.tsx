"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ParticleLoader from "@/components/ParticleLoader";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  content: string | null;
  tags: string | null;
  downloads: number;
  createdAt: string;
  uploader: { name: string };
  book: { title: string } | null;
}

export default function ResourcesPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("DOCUMENT");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/resources`)
      .then((r) => r.json())
      .then(setResources)
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch(`/api/groups/${groupId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, type, url, content }),
    });

    if (res.ok) {
      const resource = await res.json();
      setResources([resource, ...resources]);
      setTitle("");
      setDescription("");
      setUrl("");
      setContent("");
      setShowForm(false);
    }
    setSaving(false);
  }

  const typeLabel: Record<string, string> = {
    DOCUMENT: "문서",
    LINK: "링크",
    IMAGE: "이미지",
    PDF: "PDF",
  };

  const typeIcon: Record<string, string> = {
    DOCUMENT: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    LINK: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    IMAGE: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    PDF: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  };

  if (loading) {
    return <ParticleLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition mb-4"
      >
        &larr; 그룹으로 돌아가기
      </Link>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">자료실</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
        >
          {showForm ? "취소" : "자료 등록"}
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(typeLabel).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    type === value
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="자료 제목"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              placeholder="간단한 설명"
            />
            {(type === "LINK" || type === "PDF" || type === "IMAGE") && (
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="URL 입력"
              />
            )}
            {type === "DOCUMENT" && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                placeholder="자료 내용을 입력하세요"
              />
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {saving ? "등록 중..." : "자료 등록"}
            </button>
          </form>
        </div>
      )}

      {/* Resource List */}
      {resources.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          아직 등록된 자료가 없습니다.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={typeIcon[resource.type] || typeIcon.DOCUMENT}
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {typeLabel[resource.type] || resource.type}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {resource.title}
                  </h3>
                  {resource.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>{resource.uploader.name}</span>
                    <span>
                      {new Date(resource.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
