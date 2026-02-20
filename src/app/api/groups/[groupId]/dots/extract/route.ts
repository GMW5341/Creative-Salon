import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: 텍스트에서 dot 자동 추출 (AI 시뮬레이션)
// 실제 프로덕션에서는 Claude API를 호출하여 인사이트를 추출
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { groupId } = params;
  const body = await request.json();
  const { text, meetingId, source } = body;

  if (!text || text.trim().length < 10) {
    return NextResponse.json(
      { error: "추출할 텍스트가 너무 짧습니다." },
      { status: 400 }
    );
  }

  // AI 기반 dot 추출 로직
  // 실제로는 Claude API를 호출하여 다음을 수행:
  // 1. 텍스트에서 핵심 인사이트를 추출
  // 2. 각 인사이트를 한 줄로 요약
  // 3. 관련 태그를 생성
  //
  // 프롬프트 예시:
  // "다음 대화에서 유의미한 인사이트를 추출해주세요.
  //  각 인사이트는 원문, 한줄요약, 태그로 구성됩니다.
  //  결론을 내리지 말고, 사고의 재료가 될 수 있는 조각만 추출하세요."

  const extractedDots = extractInsights(text);

  const createdDots = await Promise.all(
    extractedDots.map((dot) =>
      prisma.dot.create({
        data: {
          content: dot.content,
          summary: dot.summary,
          tags: JSON.stringify(dot.tags),
          source: source || "VOICE",
          authorId: (session.user as { id: string }).id,
          groupId,
          meetingId: meetingId || null,
        },
        include: {
          author: { select: { id: true, name: true, profileImage: true } },
        },
      })
    )
  );

  return NextResponse.json({
    dots: createdDots,
    count: createdDots.length,
    message: `${createdDots.length}개의 인사이트가 추출되었습니다.`,
  });
}

// 인사이트 추출 함수 (Claude API 연동 전 로컬 로직)
// 프로덕션에서는 이 함수 대신 Claude API를 호출
function extractInsights(text: string): Array<{
  content: string;
  summary: string;
  tags: string[];
}> {
  // 문장 단위로 분리하여 의미 있는 인사이트를 추출
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15); // 너무 짧은 문장 제외

  const insights: Array<{
    content: string;
    summary: string;
    tags: string[];
  }> = [];

  for (const sentence of sentences) {
    // 인사이트 가능성이 높은 문장 필터링
    const isInsightful =
      sentence.includes("것 같") ||
      sentence.includes("라고 생각") ||
      sentence.includes("결국") ||
      sentence.includes("왜냐하면") ||
      sentence.includes("중요한") ||
      sentence.includes("핵심") ||
      sentence.includes("본질") ||
      sentence.includes("의미") ||
      sentence.includes("이란") ||
      sentence.includes("아닐까") ||
      sentence.length > 30; // 일정 길이 이상의 문장도 포함

    if (isInsightful) {
      // 간단한 태그 추출 (키워드 기반)
      const tags = extractTags(sentence);

      insights.push({
        content: sentence,
        summary: sentence.length > 50 ? sentence.slice(0, 50) + "..." : sentence,
        tags,
      });
    }
  }

  // 최대 10개까지 추출
  return insights.slice(0, 10);
}

function extractTags(text: string): string[] {
  const tagPatterns: Record<string, RegExp> = {
    "창작": /창작|글쓰기|쓰기|작가|저자/,
    "독서": /독서|읽기|책|도서|문학/,
    "삶": /삶|인생|살아|살다|생활/,
    "관계": /관계|사이|함께|소통|대화/,
    "성장": /성장|발전|변화|배움|배우/,
    "감정": /감정|느낌|기분|슬픔|기쁨|고통|행복/,
    "사회": /사회|세상|현실|시대|문화/,
    "철학": /철학|본질|의미|존재|자유|진리/,
    "교육": /교육|가르침|배움|학습|수업/,
    "예술": /예술|미학|아름다|표현|창조/,
  };

  const tags: string[] = [];
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }

  return tags.length > 0 ? tags.slice(0, 4) : ["일반"];
}
