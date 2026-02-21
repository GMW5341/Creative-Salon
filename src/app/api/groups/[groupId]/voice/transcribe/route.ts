import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transcribeWithDiarization, transcribeAudio } from "@/lib/ai";

// POST: 음성 파일 업로드 → STT (화자 분리 포함)
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

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1차: AssemblyAI (화자 분리 포함)
    const diarizedResult = await transcribeWithDiarization(buffer);

    if (diarizedResult) {
      const recording = await prisma.voiceRecording.create({
        data: {
          transcript: diarizedResult.transcript,
          duration: null,
          status: "TRANSCRIBED",
          authorId: (session.user as { id: string }).id,
          groupId,
          meetingId: meetingId || null,
        },
      });

      return NextResponse.json({
        transcript: diarizedResult.transcript,
        utterances: diarizedResult.utterances,
        speakerCount: diarizedResult.speakerCount,
        recordingId: recording.id,
        method: "assemblyai",
        message: `${diarizedResult.speakerCount}명의 화자가 감지되었습니다.`,
      });
    }

    // 2차 폴백: Whisper (화자 분리 없음)
    const transcript = await transcribeAudio(
      buffer,
      audioFile.name || "audio.webm"
    );

    if (transcript) {
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
        utterances: [],
        speakerCount: 0,
        recordingId: recording.id,
        method: "whisper",
        message: "음성이 텍스트로 변환되었습니다. (화자 분리 없음)",
      });
    }

    // 모두 실패
    return NextResponse.json(
      {
        error:
          "음성 변환에 실패했습니다. ASSEMBLYAI_API_KEY 또는 OPENAI_API_KEY를 설정해주세요.",
        fallbackToLocal: true,
      },
      { status: 422 }
    );
  } catch (e) {
    console.error("음성 변환 오류:", e);
    return NextResponse.json(
      { error: "음성 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
