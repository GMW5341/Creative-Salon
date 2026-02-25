import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 내 폴더 목록
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const folders = await prisma.noteFolder.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(folders);
}

// POST: 새 폴더 생성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const { name, description, color } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "폴더 이름을 입력해주세요." }, { status: 400 });
  }

  const folder = await prisma.noteFolder.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      color: color || "#6B7280",
      userId,
    },
    include: { _count: { select: { notes: true } } },
  });

  return NextResponse.json(folder, { status: 201 });
}
