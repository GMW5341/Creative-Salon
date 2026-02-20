import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: 음성 녹음(STT 변환된 텍스트) 저장
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
  const { transcript, duration, meetingId } = body;

  if (!transcript) {
    return NextResponse.json(
      { error: "음성 변환 텍스트가 필요합니다." },
      { status: 400 }
    );
  }

  const recording = await prisma.voiceRecording.create({
    data: {
      transcript,
      duration: duration || null,
      status: "TRANSCRIBED",
      authorId: (session.user as { id: string }).id,
      groupId,
      meetingId: meetingId || null,
    },
  });

  return NextResponse.json(recording, { status: 201 });
}

// GET: 그룹의 녹음 기록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;

  const recordings = await prisma.voiceRecording.findMany({
    where: { groupId },
    include: {
      author: { select: { name: true } },
      meeting: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recordings);
}
