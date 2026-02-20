"use client";

import { useState } from "react";

interface Dot {
  id: string;
  summary: string;
  tags: string | null;
  content: string;
}

interface ConnectionModalProps {
  fromDot: Dot;
  toDot: Dot;
  onSubmit: (insight: string) => void;
  onClose: () => void;
}

export default function ConnectionModal({
  fromDot,
  toDot,
  onSubmit,
  onClose,
}: ConnectionModalProps) {
  const [insight, setInsight] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (insight.trim()) {
      onSubmit(insight.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          연결을 발견하셨나요?
        </h3>

        {/* 두 dot 표시 */}
        <div className="space-y-3 mb-6">
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-600 mb-1">Dot A</p>
            <p className="text-sm font-medium text-gray-900">{fromDot.summary}</p>
          </div>

          <div className="flex justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>

          <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
            <p className="text-xs text-violet-600 mb-1">Dot B</p>
            <p className="text-sm font-medium text-gray-900">{toDot.summary}</p>
          </div>
        </div>

        {/* 유추 입력 */}
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이 두 생각 사이에서 어떤 연결을 발견했나요?
          </label>
          <textarea
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
            placeholder="예: 두 생각 모두 '언어를 통한 변환'이라는 공통 구조를 가지고 있다..."
            autoFocus
          />

          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={!insight.trim()}
              className="flex-1 bg-amber-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 transition"
            >
              연결 기록하기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
