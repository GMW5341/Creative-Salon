"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const PHASES = [
  "대화를 읽고 있어요",
  "문맥의 흐름을 따라가는 중",
  "숨겨진 인사이트를 발견했어요",
  "생각의 조각들을 정리하고 있어요",
];

interface Node {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  opacity: number;
  color: string;
  born: number;
}

interface Line {
  from: number;
  to: number;
  opacity: number;
  born: number;
}

export default function ExtractingOverlay() {
  const [phase, setPhase] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const linesRef = useRef<Line[]>([]);
  const frameRef = useRef(0);
  const startRef = useRef(Date.now());
  const mouseRef = useRef({ x: -1000, y: -1000 });

  const colors = useRef([
    "#d97706", "#f59e0b", "#7c3aed", "#a78bfa",
    "#d97706", "#f59e0b", "#8b5cf6",
  ]);

  const spawnNode = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * Math.min(w, h) * 0.3;
    const node: Node = {
      id: Date.now() + Math.random(),
      x: cx + Math.cos(angle) * dist * 1.8,
      y: cy + Math.sin(angle) * dist * 1.8,
      targetX: cx + Math.cos(angle) * dist,
      targetY: cy + Math.sin(angle) * dist,
      radius: 2 + Math.random() * 4,
      opacity: 0,
      color: colors.current[Math.floor(Math.random() * colors.current.length)],
      born: Date.now(),
    };
    nodesRef.current.push(node);

    // 기존 노드와 연결
    const others = nodesRef.current.filter((n) => n.id !== node.id);
    if (others.length > 0) {
      const count = Math.min(2, others.length);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      for (let i = 0; i < count; i++) {
        linesRef.current.push({
          from: node.id,
          to: shuffled[i].id,
          opacity: 0,
          born: Date.now() + 300,
        });
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 1) % PHASES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
      ctx!.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    // 초기 노드 생성
    for (let i = 0; i < 8; i++) {
      setTimeout(() => spawnNode(w(), h()), i * 200);
    }

    // 점진적으로 노드 추가
    const spawnInterval = setInterval(() => {
      if (nodesRef.current.length < 20) {
        spawnNode(w(), h());
      }
    }, 600);

    function getNodeById(id: number): Node | undefined {
      return nodesRef.current.find((n) => n.id === id);
    }

    function animate() {
      const now = Date.now();
      const elapsed = (now - startRef.current) / 1000;
      ctx!.clearRect(0, 0, w(), h());

      // 배경 그라데이션
      const grad = ctx!.createRadialGradient(w() / 2, h() / 2, 0, w() / 2, h() / 2, Math.max(w(), h()) * 0.6);
      grad.addColorStop(0, "rgba(254, 243, 199, 0.15)");
      grad.addColorStop(0.5, "rgba(196, 181, 253, 0.06)");
      grad.addColorStop(1, "rgba(255, 251, 235, 0)");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w(), h());

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // 노드 업데이트 + 그리기
      for (const node of nodesRef.current) {
        const age = (now - node.born) / 1000;
        node.opacity = Math.min(1, age / 0.6);

        // 천천히 목표 위치로
        node.x += (node.targetX - node.x) * 0.03;
        node.y += (node.targetY - node.y) * 0.03;

        // 부유 효과
        node.x += Math.sin(elapsed * 0.5 + node.id) * 0.3;
        node.y += Math.cos(elapsed * 0.4 + node.id * 1.3) * 0.3;

        // 마우스 반응
        const dx = mx - node.x;
        const dy = my - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          node.x -= dx * force * 0.02;
          node.y -= dy * force * 0.02;
        }

        // 글로우
        const glowGrad = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 4);
        glowGrad.addColorStop(0, node.color + "20");
        glowGrad.addColorStop(1, node.color + "00");
        ctx!.fillStyle = glowGrad;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
        ctx!.fill();

        // 코어
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.radius * node.opacity, 0, Math.PI * 2);
        ctx!.fillStyle = node.color + Math.round(node.opacity * 200).toString(16).padStart(2, "0");
        ctx!.fill();
      }

      // 연결선 그리기
      for (const line of linesRef.current) {
        const age = (now - line.born) / 1000;
        if (age < 0) continue;
        line.opacity = Math.min(0.3, age / 0.8);

        const from = getNodeById(line.from);
        const to = getNodeById(line.to);
        if (!from || !to) continue;

        ctx!.beginPath();
        ctx!.moveTo(from.x, from.y);

        // 약간 커브 넣기
        const midX = (from.x + to.x) / 2 + Math.sin(elapsed + line.from) * 10;
        const midY = (from.y + to.y) / 2 + Math.cos(elapsed + line.to) * 10;
        ctx!.quadraticCurveTo(midX, midY, to.x, to.y);

        ctx!.strokeStyle = `rgba(217, 119, 6, ${line.opacity})`;
        ctx!.lineWidth = 0.8;
        ctx!.stroke();
      }

      // 중심 펄스 링
      const pulseR = 30 + Math.sin(elapsed * 1.5) * 15;
      const pulseOp = 0.08 + Math.sin(elapsed * 1.5) * 0.04;
      ctx!.beginPath();
      ctx!.arc(w() / 2, h() / 2, pulseR, 0, Math.PI * 2);
      ctx!.strokeStyle = `rgba(217, 119, 6, ${pulseOp})`;
      ctx!.lineWidth = 1;
      ctx!.stroke();

      frameRef.current = requestAnimationFrame(animate);
    }

    animate();

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearInterval(spawnInterval);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [spawnNode]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: "rgba(255, 251, 235, 0.97)" }}>
      {/* 캔버스 배경 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ pointerEvents: "auto" }}
      />

      {/* 텍스트 오버레이 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
        <div className="text-center space-y-4">
          {/* 메인 텍스트 */}
          <p
            key={phase}
            className="text-lg font-medium text-gray-800"
            style={{
              animation: "extractTextFade 1s ease-in-out",
            }}
          >
            {PHASES[phase]}
          </p>

          {/* 프로그레스 바 */}
          <div className="flex justify-center gap-1.5">
            {PHASES.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-700 ${
                  i <= phase ? "bg-amber-500 w-8" : "bg-amber-200 w-2"
                }`}
              />
            ))}
          </div>

          {/* 서브 텍스트 */}
          <p className="text-sm text-gray-400 mt-2">
            대화 속 숨겨진 생각의 조각들을 찾는 중
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes extractTextFade {
          0% { opacity: 0; transform: translateY(6px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
