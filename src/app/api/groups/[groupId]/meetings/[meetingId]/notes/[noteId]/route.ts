import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// PUT: 노트 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { groupId: string; meetingId: string; noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { content, type } = await req.json();

    const note = await prisma.meetingNote.findUnique({
      where: { id: params.noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
    }

    const updated = await prisma.meetingNote.update({
      where: { id: params.noteId },
      data: {
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "노트 수정 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE: 노트 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { groupId: string; meetingId: string; noteId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const note = await prisma.meetingNote.findUnique({
      where: { id: params.noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.meetingNote.delete({ where: { id: params.noteId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "노트 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
