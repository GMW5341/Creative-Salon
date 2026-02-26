"use client";

// 나의 뇌 — 브랜드 아이콘 시스템
// 일관된 스타일: 둥근 선, 2px 스트로크, 24x24 뷰박스

interface IconProps {
  className?: string;
  size?: number;
}

// ─── 브랜드 로고: 뇌 + 회로 ───
export function BrainLogo({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="brain-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>
      </defs>
      {/* 뇌 외곽 */}
      <path
        d="M16 4C11.5 4 8 6.5 8 10c0 1.5.5 2.8 1.3 3.8C8.5 15 8 16.5 8 18c0 3.5 3 6 7 7.5.3.1.7.1 1 .1s.7 0 1-.1c4-1.5 7-4 7-7.5 0-1.5-.5-3-1.3-4.2.8-1 1.3-2.3 1.3-3.8 0-3.5-3.5-6-8-6z"
        stroke="url(#brain-grad)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* 중앙 홈 */}
      <path d="M16 7v18" stroke="url(#brain-grad)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
      {/* 좌뇌 주름 */}
      <path d="M11 10c1.5.5 2.5 2 2 3.5" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 16c2 .3 3 1.5 2.5 3" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
      {/* 우뇌 주름 */}
      <path d="M21 10c-1.5.5-2.5 2-2 3.5" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 16c-2 .3-3 1.5-2.5 3" stroke="url(#brain-grad)" strokeWidth="1.5" strokeLinecap="round" />
      {/* 시냅스 점 */}
      <circle cx="10" cy="12" r="1.2" fill="#F59E0B" opacity="0.7" />
      <circle cx="22" cy="12" r="1.2" fill="#D946EF" opacity="0.7" />
      <circle cx="13" cy="18" r="1" fill="#F59E0B" opacity="0.5" />
      <circle cx="19" cy="18" r="1" fill="#D946EF" opacity="0.5" />
    </svg>
  );
}

// ─── 타입별 아이콘 (React 컴포넌트 + SVG inline path 둘 다 제공) ───

export function MemoIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h5" />
      <circle cx="16" cy="17" r="1.5" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}

export function WritingIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3l4 4L9 19l-5 1 1-5L17 3z" />
      <path d="M15 5l4 4" />
      <path d="M9 19l-1.5-1.5" opacity="0.4" />
    </svg>
  );
}

export function QuoteIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 10V7a2 2 0 012-2h2a1 1 0 011 1v3a1 1 0 01-1 1H7.5L6 13" />
      <path d="M14 10V7a2 2 0 012-2h2a1 1 0 011 1v3a1 1 0 01-1 1h-1.5L15 13" />
      <line x1="5" y1="18" x2="19" y2="18" opacity="0.3" />
      <line x1="5" y1="21" x2="14" y2="21" opacity="0.2" />
    </svg>
  );
}

export function IdeaIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21h6M12 3a6 6 0 014 10.5V17a1 1 0 01-1 1h-6a1 1 0 01-1-1v-3.5A6 6 0 0112 3z" />
      {/* 광선 */}
      <line x1="12" y1="1" x2="12" y2="0" opacity="0.4" />
      <line x1="4.2" y1="4.2" x2="3.5" y2="3.5" opacity="0.4" />
      <line x1="19.8" y1="4.2" x2="20.5" y2="3.5" opacity="0.4" />
      <line x1="2" y1="12" x2="1" y2="12" opacity="0.3" />
      <line x1="22" y1="12" x2="23" y2="12" opacity="0.3" />
      {/* 필라멘트 */}
      <path d="M10 14c0-1 1-2 2-2s2 1 2 2" opacity="0.5" />
    </svg>
  );
}

export function ReflectionIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* 거울/물결 반사 */}
      <circle cx="12" cy="10" r="7" />
      <path d="M12 3v0M8.5 5.5l-.5-.5M15.5 5.5l.5-.5" opacity="0.3" />
      <path d="M9 10a3 3 0 016 0" />
      <path d="M12 13v1.5" />
      {/* 아래 반사 */}
      <path d="M7 20c1.5-1 3-1.5 5-1.5s3.5.5 5 1.5" opacity="0.3" />
      <path d="M8 22c1.2-.7 2.5-1 4-1s2.8.3 4 1" opacity="0.15" />
    </svg>
  );
}

export function QuestionIcon({ className = "", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 115 2.9c-.5.4-1 .8-1 1.6V15" />
      <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ─── 뷰 모드 아이콘 ───

export function ListIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="5" y1="3" x2="14" y2="3" />
      <line x1="5" y1="8" x2="14" y2="8" />
      <line x1="5" y1="13" x2="14" y2="13" />
      <circle cx="2" cy="3" r="1" fill="currentColor" stroke="none" />
      <circle cx="2" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="2" cy="13" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FolderIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4.5V12a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0014 12V6.5A1.5 1.5 0 0012.5 5H8L6.5 3H3.5A1.5 1.5 0 002 4.5z" />
    </svg>
  );
}

export function GraphIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      {/* 노드 */}
      <circle cx="8" cy="4" r="2" />
      <circle cx="3" cy="12" r="2" />
      <circle cx="13" cy="12" r="2" />
      {/* 엣지 */}
      <line x1="7" y1="5.8" x2="4" y2="10.2" opacity="0.5" />
      <line x1="9" y1="5.8" x2="12" y2="10.2" opacity="0.5" />
      <line x1="5" y1="12" x2="11" y2="12" opacity="0.3" strokeDasharray="2 1.5" />
    </svg>
  );
}

// ─── 액션 아이콘 ───

export function SparkleIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 1L9.5 5.5 14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13 1l.5 1.5L15 3l-1.5.5L13 5l-.5-1.5L11 3l1.5-.5L13 1z" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

export function PinIcon({ className = "", size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 1h4l1 4-1 1v2.5L7 13 5 8.5V5.5L4 5l1-4z" />
    </svg>
  );
}

export function SearchIcon({ className = "", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

// ─── 타입 키와 컴포넌트 매핑 ───

export const noteTypeIcons: Record<string, (props: IconProps) => JSX.Element> = {
  MEMO: MemoIcon,
  WRITING: WritingIcon,
  QUOTE: QuoteIcon,
  IDEA: IdeaIcon,
  REFLECTION: ReflectionIcon,
  QUESTION: QuestionIcon,
};

// ─── 그래프 노드용 SVG 인라인 path (transform 내부에서 사용) ───
// viewBox 0 0 14 14 기준

export const noteTypeNodePaths: Record<string, { path: string; viewBox: string }> = {
  MEMO: {
    path: "M3 1.5h8a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 12V3A1.5 1.5 0 013 1.5zM4.5 4.5h5M4.5 7h3",
    viewBox: "0 0 14 14",
  },
  WRITING: {
    path: "M10.5 1.5l2 2-7 7H3.5v-2l7-7zM9 3l2 2",
    viewBox: "0 0 14 14",
  },
  QUOTE: {
    path: "M3 6V4a1 1 0 011-1h1.5a.5.5 0 01.5.5V5.5a.5.5 0 01-.5.5H4.5L3.5 8M8 6V4a1 1 0 011-1h1.5a.5.5 0 01.5.5V5.5a.5.5 0 01-.5.5H9.5L8.5 8M3 11h8M3 13h5",
    viewBox: "0 0 14 14",
  },
  IDEA: {
    path: "M5.5 12.5h3M7 1.5a4 4 0 012.7 7V11a.5.5 0 01-.5.5H4.8a.5.5 0 01-.5-.5V8.5A4 4 0 017 1.5z",
    viewBox: "0 0 14 14",
  },
  REFLECTION: {
    path: "M7 2.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM5.5 7a1.5 1.5 0 013 0M7 9v1",
    viewBox: "0 0 14 14",
  },
  QUESTION: {
    path: "M7 1.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM5.5 5.5a1.5 1.5 0 013 1.5c0 .8-.7 1-1 1.5V10M7 11.5v.5",
    viewBox: "0 0 14 14",
  },
};
