import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { groupId: string; meetingId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const notes = await prisma.meetingNote.findMany({
      where: { meetingId: params.meetingId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: "노트를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string; meetingId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { content, type } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    const lastNote = await prisma.meetingNote.findFirst({
      where: { meetingId: params.meetingId },
      orderBy: { order: "desc" },
    });

    const note = await prisma.meetingNote.create({
      data: {
        content,
        type: type || "NOTE",
        order: (lastNote?.order ?? -1) + 1,
        meetingId: params.meetingId,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch {
    return NextResponse.json({ error: "노트 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
