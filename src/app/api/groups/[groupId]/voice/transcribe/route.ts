import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transcribeAudio } from "@/lib/ai";

// POST: 음성 파일 업로드 → Whisper STT → 텍스트 반환
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { groupId } = params;

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const meetingId = formData.get("meetingId") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "음성 파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Whisper API로 변환
    const transcript = await transcribeAudio(buffer, audioFile.name || "audio.webm");

    if (!transcript) {
      return NextResponse.json(
        {
          error: "음성 변환에 실패했습니다. OPENAI_API_KEY가 설정되어 있는지 확인해주세요.",
          fallbackToLocal: true,
        },
        { status: 422 }
      );
    }

    // 녹음 기록 저장
    const recording = await prisma.voiceRecording.create({
      data: {
        transcript,
        duration: null,
        status: "TRANSCRIBED",
        authorId: (session.user as { id: string }).id,
        groupId,
        meetingId: meetingId || null,
      },
    });

    return NextResponse.json({
      transcript,
      recordingId: recording.id,
      message: "음성이 텍스트로 변환되었습니다.",
    });
  } catch (e) {
    console.error("음성 변환 오류:", e);
    return NextResponse.json(
      { error: "음성 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
