import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findNearbyWithAI } from "@/lib/ai";

// GET: 특정 dot과 관련된 다른 dot 조회
// AI가 있으면 구조적 유추 기반, 없으면 태그 유사도 기반
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  const { searchParams } = new URL(request.url);
  const dotId = searchParams.get("dotId");

  if (!dotId) {
    return NextResponse.json({ error: "dotId가 필요합니다." }, { status: 400 });
  }

  const targetDot = await prisma.dot.findUnique({
    where: { id: dotId },
  });

  if (!targetDot) {
    return NextResponse.json({ error: "dot을 찾을 수 없습니다." }, { status: 404 });
  }

  const allDots = await prisma.dot.findMany({
    where: {
      groupId,
      id: { not: dotId },
    },
    include: {
      author: { select: { id: true, name: true } },
      meeting: { select: { id: true, title: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // AI 기반 유사 dot 검색 시도
  const aiResults = await findNearbyWithAI(
    { content: targetDot.content, summary: targetDot.summary },
    allDots.map((d) => ({ id: d.id, content: d.content, summary: d.summary }))
  );

  if (aiResults.length > 0) {
    // AI 결과가 있으면 AI 추천 사용
    const nearbyDots = aiResults
      .map((r) => {
        const dot = allDots.find((d) => d.id === r.id);
        return dot ? { ...dot, relevance: r.relevance } : null;
      })
      .filter(Boolean);

    return NextResponse.json({
      target: targetDot,
      nearby: nearbyDots,
      method: "ai",
    });
  }

  // AI 없으면 태그 + 키워드 기반 폴백
  const targetTags: string[] = targetDot.tags ? JSON.parse(targetDot.tags) : [];

  const scoredDots = allDots
    .map((dot) => {
      const dotTags: string[] = dot.tags ? JSON.parse(dot.tags) : [];
      const commonTags = targetTags.filter((t) => dotTags.includes(t));
      const score =
        targetTags.length > 0 && dotTags.length > 0
          ? commonTags.length / Math.max(targetTags.length, dotTags.length)
          : 0;

      const targetWords = targetDot.content.split(/\s+/);
      const dotWords = dot.content.split(/\s+/);
      const commonWords = targetWords.filter(
        (w) => w.length > 2 && dotWords.some((dw) => dw.includes(w))
      );
      const wordBonus = commonWords.length * 0.05;

      return { ...dot, similarity: Math.min(score + wordBonus, 1) };
    })
    .filter((dot) => dot.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  return NextResponse.json({
    target: targetDot,
    nearby: scoredDots,
    method: "tags",
  });
}
