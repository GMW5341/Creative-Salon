"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

export default function ParticleLoader({ text = "로딩 중..." }: { text?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = [
      "rgba(217, 119, 6, 0.6)",   // amber-600
      "rgba(245, 158, 11, 0.5)",  // amber-500
      "rgba(252, 211, 77, 0.4)",  // amber-300
      "rgba(180, 83, 9, 0.3)",    // amber-800
      "rgba(254, 243, 199, 0.5)", // amber-100
    ];

    function resize() {
      canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    }

    function initParticles() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const count = Math.min(80, Math.floor((w * h) / 4000));
      particlesRef.current = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        particlesRef.current.push({
          x,
          y,
          baseX: x,
          baseY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    }

    function animate() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const particles = particlesRef.current;

      for (const p of particles) {
        // Mouse interaction
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 120;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          const angle = Math.atan2(dy, dx);
          // Attract towards mouse gently
          p.vx += Math.cos(angle) * force * 0.15;
          p.vy += Math.sin(angle) * force * 0.15;
        } else {
          // Drift back to base position
          p.vx += (p.baseX - p.x) * 0.005;
          p.vy += (p.baseY - p.y) * 0.005;
        }

        // Apply velocity with friction
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw particle
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();
      }

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.strokeStyle = `rgba(217, 119, 6, ${0.15 * (1 - dist / 100)})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function handleMouseLeave() {
      mouseRef.current = { x: -1000, y: -1000 };
    }

    resize();
    animate();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "auto" }}
      />
      <div className="relative z-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-amber-200 border-t-amber-600 animate-spin" />
        <p className="text-gray-500 text-sm">{text}</p>
      </div>
    </div>
  );
}
