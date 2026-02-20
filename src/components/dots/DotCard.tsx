"use client";

interface DotCardProps {
  dot: {
    id: string;
    content: string;
    summary: string;
    tags: string | null;
    source: string;
    createdAt: string;
    author: { name: string };
    meeting?: { title: string; date: string } | null;
  };
  isSelected?: boolean;
  onSelect?: (dotId: string) => void;
  compact?: boolean;
}

export default function DotCard({ dot, isSelected, onSelect, compact }: DotCardProps) {
  const tags: string[] = dot.tags ? JSON.parse(dot.tags) : [];

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

  return (
    <div
      onClick={() => onSelect?.(dot.id)}
      className={`rounded-xl border p-4 transition cursor-pointer ${
        isSelected
          ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200"
          : "border-gray-200 bg-white hover:shadow-sm hover:border-gray-300"
      } ${compact ? "p-3" : "p-4"}`}
    >
      {/* 상단: 출처 + 시간 */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            sourceColor[dot.source] || sourceColor.MANUAL
          }`}
        >
          {sourceLabel[dot.source] || dot.source}
        </span>
        <span className="text-[10px] text-gray-400">
          {new Date(dot.createdAt).toLocaleDateString("ko-KR", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {dot.meeting && (
          <span className="text-[10px] text-gray-400 truncate">
            {dot.meeting.title}
          </span>
        )}
      </div>

      {/* 요약 */}
      <p className={`font-medium text-gray-900 ${compact ? "text-sm" : ""}`}>
        {dot.summary}
      </p>

      {/* 원문 (compact 모드에서는 숨김) */}
      {!compact && dot.content !== dot.summary && (
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{dot.content}</p>
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

      {/* 작성자 */}
      <p className="text-[10px] text-gray-400 mt-2">{dot.author.name}</p>
    </div>
  );
}
