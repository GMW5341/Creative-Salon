import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findNearbyWithAI } from "@/lib/ai";

// GET: 특정 synap과 관련된 다른 synap 조회
// AI가 있으면 구조적 유추 기반, 없으면 태그 유사도 기반
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  const { searchParams } = new URL(request.url);
  const synapId = searchParams.get("synapId");

  if (!synapId) {
    return NextResponse.json({ error: "synapId가 필요합니다." }, { status: 400 });
  }

  const targetSynap = await prisma.synap.findUnique({
    where: { id: synapId },
  });

  if (!targetSynap) {
    return NextResponse.json({ error: "Synap을 찾을 수 없습니다." }, { status: 404 });
  }

  const allSynaps = await prisma.synap.findMany({
    where: {
      groupId,
      id: { not: synapId },
    },
    include: {
      author: { select: { id: true, name: true } },
      meeting: { select: { id: true, title: true, date: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // AI 기반 유사 synap 검색 시도
  const aiResults = await findNearbyWithAI(
    { content: targetSynap.content, summary: targetSynap.summary },
    allSynaps.map((s) => ({ id: s.id, content: s.content, summary: s.summary }))
  );

  if (aiResults.length > 0) {
    const nearbySynaps = aiResults
      .map((r) => {
        const synap = allSynaps.find((s) => s.id === r.id);
        return synap ? { ...synap, relevance: r.relevance } : null;
      })
      .filter(Boolean);

    return NextResponse.json({
      target: targetSynap,
      nearby: nearbySynaps,
      method: "ai",
    });
  }

  // AI 없으면 태그 + 키워드 기반 폴백
  const targetTags: string[] = targetSynap.tags ? JSON.parse(targetSynap.tags) : [];

  const scoredSynaps = allSynaps
    .map((synap) => {
      const synapTags: string[] = synap.tags ? JSON.parse(synap.tags) : [];
      const commonTags = targetTags.filter((t) => synapTags.includes(t));
      const score =
        targetTags.length > 0 && synapTags.length > 0
          ? commonTags.length / Math.max(targetTags.length, synapTags.length)
          : 0;

      const targetWords = targetSynap.content.split(/\s+/);
      const synapWords = synap.content.split(/\s+/);
      const commonWords = targetWords.filter(
        (w) => w.length > 2 && synapWords.some((sw) => sw.includes(w))
      );
      const wordBonus = commonWords.length * 0.05;

      return { ...synap, similarity: Math.min(score + wordBonus, 1) };
    })
    .filter((synap) => synap.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10);

  return NextResponse.json({
    target: targetSynap,
    nearby: scoredSynaps,
    method: "tags",
  });
}
