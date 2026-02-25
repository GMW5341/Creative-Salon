import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 내 개인 노트 목록
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { userId };
  const folderId = searchParams.get("folderId");

  if (type && type !== "ALL") {
    where.type = type;
  }

  if (folderId === "uncategorized") {
    where.folderId = null;
  } else if (folderId) {
    where.folderId = folderId;
  }

  if (q) {
    where.OR = [
      { content: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
    ];
  }

  const notes = await prisma.personalNote.findMany({
    where,
    include: { folder: { select: { id: true, name: true, color: true } } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  // 태그 필터 (JSON 문자열이라 앱 레벨에서 필터)
  const filtered = tag
    ? notes.filter((n) => {
        try {
          const tags: string[] = n.tags ? JSON.parse(n.tags) : [];
          return tags.includes(tag);
        } catch {
          return false;
        }
      })
    : notes;

  return NextResponse.json(filtered);
}

// POST: 새 개인 노트 작성
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await request.json();
  const { content, title, type, tags, imageUrl, folderId: noteFolderId } = body;

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const note = await prisma.personalNote.create({
    data: {
      content: content.trim(),
      title: title?.trim() || null,
      type: type || "MEMO",
      tags: tags ? JSON.stringify(tags) : null,
      imageUrl: imageUrl || null,
      folderId: noteFolderId || null,
      userId,
    },
    include: { folder: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
