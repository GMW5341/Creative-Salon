import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PUT: 폴더 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const folder = await prisma.noteFolder.findFirst({
    where: { id: params.folderId, userId },
  });

  if (!folder) {
    return NextResponse.json({ error: "폴더를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json();
  const { name, description, color, order } = body;

  const updated = await prisma.noteFolder.update({
    where: { id: params.folderId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(color !== undefined && { color }),
      ...(order !== undefined && { order }),
    },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(updated);
}

// DELETE: 폴더 삭제 (메모는 미분류로)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { folderId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const folder = await prisma.noteFolder.findFirst({
    where: { id: params.folderId, userId },
  });

  if (!folder) {
    return NextResponse.json({ error: "폴더를 찾을 수 없습니다." }, { status: 404 });
  }

  // 폴더 안의 메모는 미분류(folderId=null)로 변경 후 삭제
  await prisma.personalNote.updateMany({
    where: { folderId: params.folderId },
    data: { folderId: null },
  });

  await prisma.noteFolder.delete({ where: { id: params.folderId } });

  return NextResponse.json({ success: true });
}
