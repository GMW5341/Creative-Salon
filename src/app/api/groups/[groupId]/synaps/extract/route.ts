import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractSynapsWithAI } from "@/lib/ai";

// POST: 텍스트에서 synap 자동 추출 (Claude API 연동)
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

  // AI로 인사이트 추출 (API 키 없으면 로컬 폴백)
  const extractedSynaps = await extractSynapsWithAI(text);

  if (extractedSynaps.length === 0) {
    return NextResponse.json({
      synaps: [],
      count: 0,
      message: "추출할 인사이트를 찾지 못했습니다. 더 긴 대화를 입력해보세요.",
    });
  }

  const createdSynaps = await Promise.all(
    extractedSynaps.map((synap) =>
      prisma.synap.create({
        data: {
          content: synap.content,
          summary: synap.summary,
          tags: JSON.stringify(synap.tags),
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

  // 음성 녹음이었다면 synapsExtracted 업데이트
  if (meetingId) {
    await prisma.voiceRecording.updateMany({
      where: { meetingId, authorId: (session.user as { id: string }).id },
      data: { synapsExtracted: createdSynaps.length, status: "PROCESSED" },
    });
  }

  return NextResponse.json({
    synaps: createdSynaps,
    count: createdSynaps.length,
    message: `${createdSynaps.length}개의 인사이트가 추출되었습니다.`,
  });
}
