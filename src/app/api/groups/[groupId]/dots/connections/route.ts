import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 그룹의 모든 연결(유추) 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;

  const connections = await prisma.dotConnection.findMany({
    where: {
      fromDot: { groupId },
    },
    include: {
      fromDot: {
        select: { id: true, summary: true, tags: true, content: true, createdAt: true },
      },
      toDot: {
        select: { id: true, summary: true, tags: true, content: true, createdAt: true },
      },
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

// POST: 새로운 연결(유추) 생성 — 사용자가 직접 dot을 연결
export async function POST(
  request: NextRequest,
  _context: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  void _context;
  const body = await request.json();
  const { fromDotId, toDotId, insight } = body;

  if (!fromDotId || !toDotId || !insight) {
    return NextResponse.json(
      { error: "두 개의 dot과 발견한 연결 설명이 필요합니다." },
      { status: 400 }
    );
  }

  if (fromDotId === toDotId) {
    return NextResponse.json(
      { error: "서로 다른 dot을 선택해주세요." },
      { status: 400 }
    );
  }

  const connection = await prisma.dotConnection.create({
    data: {
      fromDotId,
      toDotId,
      insight,
      authorId: (session.user as { id: string }).id,
    },
    include: {
      fromDot: { select: { id: true, summary: true, tags: true } },
      toDot: { select: { id: true, summary: true, tags: true } },
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(connection, { status: 201 });
}
