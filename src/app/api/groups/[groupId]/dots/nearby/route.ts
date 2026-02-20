import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 특정 dot 근처의 관련 dot 조회 (태그 기반 유사도)
// 프로덕션에서는 Vector DB 기반 의미 유사도 검색으로 대체
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

  // 기준 dot 조회
  const targetDot = await prisma.dot.findUnique({
    where: { id: dotId },
  });

  if (!targetDot) {
    return NextResponse.json({ error: "dot을 찾을 수 없습니다." }, { status: 404 });
  }

  // 태그 기반 유사 dot 검색 (간이 벡터 검색 대체)
  const targetTags: string[] = targetDot.tags ? JSON.parse(targetDot.tags) : [];

  // 같은 그룹의 다른 dot들 조회
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

  // 태그 유사도 계산하여 정렬
  const scoredDots = allDots
    .map((dot) => {
      const dotTags: string[] = dot.tags ? JSON.parse(dot.tags) : [];
      const commonTags = targetTags.filter((t) => dotTags.includes(t));
      const score =
        targetTags.length > 0 && dotTags.length > 0
          ? commonTags.length / Math.max(targetTags.length, dotTags.length)
          : 0;

      // 키워드 매칭 보너스
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
  });
}
