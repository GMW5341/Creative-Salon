import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 개인 노트 단일 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const note = await prisma.personalNote.findFirst({
    where: { id: params.noteId, userId },
  });

  if (!note) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(note);
}

// PUT: 개인 노트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const note = await prisma.personalNote.findFirst({
    where: { id: params.noteId, userId },
  });

  if (!note) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const { content, title, type, tags, isPinned, imageUrl } = body;

  const updated = await prisma.personalNote.update({
    where: { id: params.noteId },
    data: {
      ...(content !== undefined && { content: content.trim() }),
      ...(title !== undefined && { title: title?.trim() || null }),
      ...(type !== undefined && { type }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(isPinned !== undefined && { isPinned }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE: 개인 노트 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const note = await prisma.personalNote.findFirst({
    where: { id: params.noteId, userId },
  });

  if (!note) {
    return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.personalNote.delete({ where: { id: params.noteId } });

  return NextResponse.json({ success: true });
}
