"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";

interface NoteFolder {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: { notes: number };
}

interface PersonalNote {
  id: string;
  content: string;
  title: string | null;
  type: string;
  tags: string | null;
  folderId: string | null;
  folder: { id: string; name: string; color: string } | null;
  createdAt: string;
}

interface GraphNode {
  id: string;
  type: "folder" | "note" | "tag";
  label: string;
  color: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  // 추가 정보
  noteType?: string;
  content?: string;
  folderId?: string | null;
  noteCount?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "folder-note" | "tag-link";
}

const TYPE_COLORS: Record<string, string> = {
  MEMO: "#6B7280",
  WRITING: "#D97706",
  QUOTE: "#7C3AED",
  IDEA: "#CA8A04",
  REFLECTION: "#2563EB",
  QUESTION: "#16A34A",
};

export default function NoteGraph({
  folders,
  allNotes,
}: {
  notes: PersonalNote[];
  folders: NoteFolder[];
  allNotes: PersonalNote[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const [, forceRender] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 500 });
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 700, h: 500 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const iterRef = useRef(0);

  // 그래프 데이터 빌드
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const tagMap = new Map<string, string[]>(); // tag -> noteIds

    // 폴더 노드
    const folderAngleStep = folders.length > 0 ? (Math.PI * 2) / folders.length : 0;
    folders.forEach((f, i) => {
      const angle = folderAngleStep * i - Math.PI / 2;
      const dist = Math.min(dimensions.width, dimensions.height) * 0.28;
      nodes.push({
        id: `folder-${f.id}`,
        type: "folder",
        label: f.name,
        color: f.color,
        radius: 28 + Math.min(f._count.notes * 2, 16),
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        noteCount: f._count.notes,
      });
    });

    // 미분류 폴더 노드 (미분류 메모가 있을 때)
    const uncatNotes = allNotes.filter((n) => !n.folderId);
    if (uncatNotes.length > 0) {
      nodes.push({
        id: "folder-uncategorized",
        type: "folder",
        label: "미분류",
        color: "#9CA3AF",
        radius: 24 + Math.min(uncatNotes.length * 2, 12),
        x: cx,
        y: cy,
        vx: 0, vy: 0,
        noteCount: uncatNotes.length,
      });
    }

    // 노트 노드
    allNotes.forEach((n) => {
      const fNodeId = n.folderId ? `folder-${n.folderId}` : "folder-uncategorized";
      const folderNode = nodes.find((nd) => nd.id === fNodeId);
      const jitter = () => (Math.random() - 0.5) * 80;
      nodes.push({
        id: `note-${n.id}`,
        type: "note",
        label: n.title || n.content.slice(0, 30) + (n.content.length > 30 ? "..." : ""),
        color: TYPE_COLORS[n.type] || TYPE_COLORS.MEMO,
        radius: 6,
        x: (folderNode?.x || cx) + jitter(),
        y: (folderNode?.y || cy) + jitter(),
        vx: 0, vy: 0,
        noteType: n.type,
        content: n.content,
        folderId: n.folderId,
      });

      // 폴더-노트 엣지
      edges.push({ source: fNodeId, target: `note-${n.id}`, type: "folder-note" });

      // 태그 수집
      try {
        const tags: string[] = n.tags ? JSON.parse(n.tags) : [];
        tags.forEach((tag) => {
          if (!tagMap.has(tag)) tagMap.set(tag, []);
          tagMap.get(tag)!.push(n.id);
        });
      } catch {}
    });

    // 태그 노드 + 엣지 (2개 이상의 노트가 공유하는 태그만)
    tagMap.forEach((noteIds, tag) => {
      if (noteIds.length < 2) return;

      // 태그 노드 위치: 연결된 노트들의 중간 지점
      const relatedNotes = noteIds.map((nid) => nodes.find((nd) => nd.id === `note-${nid}`)).filter(Boolean) as GraphNode[];
      const avgX = relatedNotes.reduce((s, n) => s + n.x, 0) / relatedNotes.length;
      const avgY = relatedNotes.reduce((s, n) => s + n.y, 0) / relatedNotes.length;

      const tagNodeId = `tag-${tag}`;
      nodes.push({
        id: tagNodeId,
        type: "tag",
        label: `#${tag}`,
        color: "#E5E7EB",
        radius: 14 + Math.min(noteIds.length, 6),
        x: avgX + (Math.random() - 0.5) * 40,
        y: avgY + (Math.random() - 0.5) * 40,
        vx: 0, vy: 0,
      });

      noteIds.forEach((nid) => {
        edges.push({ source: tagNodeId, target: `note-${nid}`, type: "tag-link" });
      });
    });

    return { nodes, edges };
  }, [allNotes, folders, dimensions]);

  // dimension 추적
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0) setDimensions({ width, height: Math.max(height, 450) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 시뮬레이션
  useEffect(() => {
    nodesRef.current = initialNodes.map((n) => ({ ...n }));
    edgesRef.current = [...initialEdges];
    iterRef.current = 0;

    const nodeMap = new Map<string, GraphNode>();
    nodesRef.current.forEach((n) => nodeMap.set(n.id, n));

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    function tick() {
      iterRef.current++;
      const alpha = Math.max(0.001, 1 - iterRef.current / 300); // 점진적 냉각
      const nodes = nodesRef.current;

      // 1. 중력 (중심으로)
      for (const n of nodes) {
        n.vx += (cx - n.x) * 0.002 * alpha;
        n.vy += (cy - n.y) * 0.002 * alpha;
      }

      // 2. 노드 간 반발력
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = a.radius + b.radius + 20;

          // 폴더-폴더 간 더 강한 반발
          let strength = 400;
          if (a.type === "folder" && b.type === "folder") strength = 2000;
          else if (a.type === "tag" || b.type === "tag") strength = 200;

          if (dist < minDist * 3) {
            const force = (strength * alpha) / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx; a.vy -= fy;
            b.vx += fx; b.vy += fy;
          }
        }
      }

      // 3. 엣지 인력
      for (const e of edgesRef.current) {
        const s = nodeMap.get(e.source);
        const t = nodeMap.get(e.target);
        if (!s || !t) continue;

        const dx = t.x - s.x, dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        let targetDist = 60;
        let strength = 0.03;
        if (e.type === "folder-note") { targetDist = 55; strength = 0.05; }
        if (e.type === "tag-link") { targetDist = 80; strength = 0.01; }

        const force = (dist - targetDist) * strength * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        s.vx += fx; s.vy += fy;
        t.vx -= fx; t.vy -= fy;
      }

      // 4. 속도 적용 + 감쇠
      for (const n of nodes) {
        if (n.id === dragNode) continue;
        n.vx *= 0.6;
        n.vy *= 0.6;
        n.x += n.vx;
        n.y += n.vy;
        // 경계 제한 (느슨하게)
        n.x = Math.max(-200, Math.min(dimensions.width + 200, n.x));
        n.y = Math.max(-200, Math.min(dimensions.height + 200, n.y));
      }

      forceRender((v) => v + 1);

      if (iterRef.current < 600) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [initialNodes, initialEdges, dimensions, dragNode]);

  // 드래그
  const handleMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragNode(nodeId);
    setSelectedNode(nodesRef.current.find((n) => n.id === nodeId) || null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragNode) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const x = viewBox.x + (e.clientX - rect.left) * scaleX;
      const y = viewBox.y + (e.clientY - rect.top) * scaleY;
      const node = nodesRef.current.find((n) => n.id === dragNode);
      if (node) {
        node.x = x; node.y = y;
        node.vx = 0; node.vy = 0;
      }
      iterRef.current = Math.min(iterRef.current, 500); // 재시뮬레이션
      if (iterRef.current >= 600) {
        iterRef.current = 500;
        animRef.current = requestAnimationFrame(() => {
          forceRender((v) => v + 1);
        });
      }
    } else if (isPanning) {
      const dx = (e.clientX - panStart.current.x) * (viewBox.w / dimensions.width);
      const dy = (e.clientY - panStart.current.y) * (viewBox.h / dimensions.height);
      setViewBox((prev) => ({
        ...prev,
        x: panStart.current.vx - dx,
        y: panStart.current.vy - dy,
      }));
    }
  }, [dragNode, isPanning, viewBox, dimensions]);

  const handleMouseUp = useCallback(() => {
    setDragNode(null);
    setIsPanning(false);
  }, []);

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === "rect") {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
      setSelectedNode(null);
    }
  }, [viewBox]);

  // 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    setViewBox((prev) => {
      const newW = Math.max(300, Math.min(2000, prev.w * factor));
      const newH = Math.max(200, Math.min(1500, prev.h * factor));
      const svg = svgRef.current;
      if (!svg) return prev;
      const rect = svg.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      return {
        x: prev.x + (prev.w - newW) * mx,
        y: prev.y + (prev.h - newH) * my,
        w: newW,
        h: newH,
      };
    });
  }, []);

  // 뷰박스 초기화
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: dimensions.width, h: dimensions.height });
  }, [dimensions]);

  // 선택된 노드와 연결된 엣지/노드 찾기
  const connectedIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const ids = new Set<string>([selectedNode.id]);
    edgesRef.current.forEach((e) => {
      if (e.source === selectedNode.id) ids.add(e.target);
      if (e.target === selectedNode.id) ids.add(e.source);
    });
    return ids;
  }, [selectedNode, /* trigger */ nodesRef.current.length]); // eslint-disable-line

  const nodes = nodesRef.current;
  const edges = edgesRef.current;
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // 빈 상태
  if (allNotes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">관계도를 그릴 메모가 없어요</h2>
        <p className="text-sm text-gray-400">메모를 작성하고 폴더로 정리하면 여기에 관계도가 나타납니다.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: "500px" }}>
      {/* 범례 */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 px-3 py-2 z-10">
        <p className="text-[10px] text-gray-500 font-medium mb-1.5">범례</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-400 border-2 border-white shadow" />
            <span className="text-[10px] text-gray-500">폴더</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-[10px] text-gray-500">메모</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-gray-200 border border-dashed border-gray-400" />
            <span className="text-[10px] text-gray-500">공유 태그</span>
          </div>
        </div>
      </div>

      {/* 조작 안내 */}
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 px-3 py-2 z-10">
        <p className="text-[10px] text-gray-400">드래그: 이동 / 스크롤: 확대축소 / 클릭: 상세</p>
      </div>

      {/* 선택된 노트 상세 */}
      {selectedNode && (
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 p-4 z-10 shadow-lg max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
              <span className="text-xs font-medium text-gray-700">
                {selectedNode.type === "folder" ? "폴더" : selectedNode.type === "tag" ? "태그" : "메모"}
              </span>
              <span className="text-sm font-semibold text-gray-900">{selectedNode.label}</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              닫기
            </button>
          </div>
          {selectedNode.type === "note" && selectedNode.content && (
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-5">
              {selectedNode.content}
            </p>
          )}
          {selectedNode.type === "folder" && (
            <p className="text-xs text-gray-500">{selectedNode.noteCount}개 메모가 이 폴더에 속해 있습니다.</p>
          )}
          {selectedNode.type === "tag" && (
            <p className="text-xs text-gray-500">
              이 태그를 공유하는 메모 {edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id).length}개가 연결되어 있습니다.
            </p>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="bg-gray-50 rounded-2xl border border-gray-200 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          {/* 글로우 필터 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* 배경 (클릭 대상) */}
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="transparent" />

        {/* 엣지 */}
        {edges.map((e, i) => {
          const s = nodeMap.get(e.source);
          const t = nodeMap.get(e.target);
          if (!s || !t) return null;

          const isHighlighted = selectedNode && (connectedIds.has(e.source) && connectedIds.has(e.target));
          const isTagLink = e.type === "tag-link";
          const opacity = selectedNode
            ? (isHighlighted ? 0.6 : 0.05)
            : (isTagLink ? 0.15 : 0.2);

          return (
            <line
              key={`edge-${i}`}
              x1={s.x} y1={s.y}
              x2={t.x} y2={t.y}
              stroke={isTagLink ? "#A78BFA" : s.color || "#D1D5DB"}
              strokeWidth={isHighlighted ? 1.5 : 0.8}
              strokeOpacity={opacity}
              strokeDasharray={isTagLink ? "4 3" : undefined}
            />
          );
        })}

        {/* 노드 */}
        {nodes.map((node) => {
          const isHovered = hoveredNode?.id === node.id;
          const isSelected = selectedNode?.id === node.id;
          const isConnected = connectedIds.has(node.id);
          const opacity = selectedNode
            ? (isSelected || isConnected ? 1 : 0.15)
            : 1;

          if (node.type === "folder") {
            return (
              <g
                key={node.id}
                style={{ opacity, transition: "opacity 0.3s" }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                {/* 외곽 글로우 */}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.radius + 4}
                  fill={node.color}
                  opacity={isHovered || isSelected ? 0.2 : 0}
                  style={{ transition: "opacity 0.2s" }}
                />
                {/* 메인 원 */}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.radius}
                  fill="white"
                  stroke={node.color}
                  strokeWidth={isSelected ? 3 : 2}
                  filter="url(#shadow)"
                />
                {/* 내부 색 */}
                <circle
                  cx={node.x} cy={node.y}
                  r={node.radius - 4}
                  fill={node.color}
                  opacity={0.12}
                />
                {/* 폴더 아이콘 */}
                <g transform={`translate(${node.x - 7}, ${node.y - 10})`}>
                  <path
                    d="M1 4v8a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0013 12V6a1.5 1.5 0 00-1.5-1.5H8L6.5 3h-4A1.5 1.5 0 001 4z"
                    fill={node.color}
                    opacity={0.7}
                  />
                </g>
                {/* 라벨 */}
                <text
                  x={node.x} y={node.y + node.radius + 14}
                  textAnchor="middle"
                  className="text-[11px] font-semibold fill-gray-700"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label}
                </text>
                {/* 카운트 */}
                <text
                  x={node.x} y={node.y + 7}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-400"
                  style={{ pointerEvents: "none" }}
                >
                  {node.noteCount}
                </text>
              </g>
            );
          }

          if (node.type === "tag") {
            return (
              <g
                key={node.id}
                style={{ opacity, transition: "opacity 0.3s" }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <rect
                  x={node.x - node.radius}
                  y={node.y - node.radius * 0.6}
                  width={node.radius * 2}
                  height={node.radius * 1.2}
                  rx={6}
                  fill="white"
                  stroke="#D1D5DB"
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray="3 2"
                />
                <text
                  x={node.x} y={node.y + 3.5}
                  textAnchor="middle"
                  className="text-[9px] fill-purple-500 font-medium"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label}
                </text>
              </g>
            );
          }

          // 노트 노드
          return (
            <g
              key={node.id}
              style={{ opacity, transition: "opacity 0.3s" }}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
            >
              <circle
                cx={node.x} cy={node.y}
                r={isHovered || isSelected ? node.radius + 3 : node.radius}
                fill={node.color}
                opacity={isHovered || isSelected ? 0.9 : 0.7}
                stroke={isSelected ? node.color : "white"}
                strokeWidth={isSelected ? 2 : 1}
                style={{ transition: "r 0.15s, opacity 0.15s" }}
              />
              {/* 호버 시 라벨 */}
              {(isHovered || isSelected) && (
                <text
                  x={node.x} y={node.y - node.radius - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-gray-600 font-medium"
                  style={{ pointerEvents: "none" }}
                >
                  {node.label.length > 25 ? node.label.slice(0, 25) + "..." : node.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
