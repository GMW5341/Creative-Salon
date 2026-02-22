"use client";

import { useEffect, useState, useRef } from "react";

const PHASES = [
  { text: "대화를 읽고 있어요", icon: "scan" },
  { text: "문맥을 이해하는 중", icon: "think" },
  { text: "인사이트를 발견했어요", icon: "spark" },
  { text: "조각을 정리하고 있어요", icon: "sort" },
];

export default function ExtractingOverlay() {
  const [phase, setPhase] = useState(0);
  const [nodes, setNodes] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [connections, setConnections] = useState<Array<{ from: number; to: number; delay: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 페이즈 전환 (각 1초)
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 노드 생성 애니메이션
    const newNodes: typeof nodes = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const radius = 70;
      newNodes.push({
        id: i,
        x: 50 + Math.cos(angle) * radius / 2,
        y: 50 + Math.sin(angle) * radius / 2,
        delay: i * 0.3,
      });
    }
    setNodes(newNodes);

    // 연결선 (시간차)
    const newConnections: typeof connections = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (Math.random() > 0.5) {
          newConnections.push({
            from: i,
            to: j,
            delay: Math.max(newNodes[i].delay, newNodes[j].delay) + 0.4,
          });
        }
      }
    }
    setConnections(newConnections);
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(255, 251, 235, 0.95)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex flex-col items-center gap-8 max-w-sm px-6">
        {/* 뉴럴 네트워크 비주얼 */}
        <div className="relative w-56 h-56">
          {/* 은은한 글로우 배경 */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/30 to-violet-200/20 blur-2xl animate-pulse" />

          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
            {/* 연결선 */}
            {connections.map((conn, idx) => {
              const from = nodes[conn.from];
              const to = nodes[conn.to];
              if (!from || !to) return null;
              return (
                <line
                  key={`c-${idx}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="url(#lineGradient)"
                  strokeWidth="0.3"
                  strokeDasharray="2 2"
                  opacity="0"
                  className="animate-line-appear"
                  style={{
                    animationDelay: `${conn.delay}s`,
                    animationFillMode: "forwards",
                  }}
                />
              );
            })}

            {/* 노드 */}
            {nodes.map((node) => (
              <g key={node.id}>
                {/* 글로우 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill="none"
                  stroke={node.id % 2 === 0 ? "rgba(217, 119, 6, 0.2)" : "rgba(139, 92, 246, 0.2)"}
                  strokeWidth="1"
                  opacity="0"
                  className="animate-node-glow"
                  style={{
                    animationDelay: `${node.delay}s`,
                    animationFillMode: "forwards",
                  }}
                />
                {/* 코어 */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="2"
                  fill={node.id % 2 === 0 ? "#d97706" : "#7c3aed"}
                  opacity="0"
                  className="animate-node-appear"
                  style={{
                    animationDelay: `${node.delay}s`,
                    animationFillMode: "forwards",
                  }}
                />
              </g>
            ))}

            {/* 중심 펄스 */}
            <circle
              cx="50"
              cy="50"
              r="3"
              fill="none"
              stroke="rgba(217, 119, 6, 0.3)"
              strokeWidth="0.5"
              className="animate-center-pulse"
            />

            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 텍스트 영역 */}
        <div className="text-center space-y-3">
          {/* 메인 텍스트 */}
          <p
            key={phase}
            className="text-gray-800 font-medium animate-text-fade"
          >
            {PHASES[phase].text}
          </p>

          {/* 프로그레스 도트 */}
          <div className="flex justify-center gap-1.5">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i <= phase
                    ? "bg-amber-500 w-6"
                    : "bg-gray-200 w-1.5"
                }`}
              />
            ))}
          </div>

          {/* 서브텍스트 */}
          <p className="text-xs text-gray-400">
            대화 속 숨겨진 생각의 조각들을 찾는 중
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes node-appear {
          0% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes node-glow {
          0% { opacity: 0; r: 2; }
          50% { opacity: 0.6; r: 6; }
          100% { opacity: 0.3; r: 5; }
        }
        @keyframes line-appear {
          0% { opacity: 0; stroke-dashoffset: 10; }
          100% { opacity: 0.6; stroke-dashoffset: 0; }
        }
        @keyframes center-pulse {
          0% { r: 3; opacity: 0.3; }
          50% { r: 8; opacity: 0; }
          100% { r: 3; opacity: 0.3; }
        }
        @keyframes text-fade {
          0% { opacity: 0; transform: translateY(4px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        :global(.animate-node-appear) {
          animation: node-appear 0.6s ease-out;
        }
        :global(.animate-node-glow) {
          animation: node-glow 0.8s ease-out;
        }
        :global(.animate-line-appear) {
          animation: line-appear 0.8s ease-out;
        }
        :global(.animate-center-pulse) {
          animation: center-pulse 2s ease-in-out infinite;
        }
        :global(.animate-text-fade) {
          animation: text-fade 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}
