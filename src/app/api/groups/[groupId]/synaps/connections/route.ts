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

  const connections = await prisma.synapConnection.findMany({
    where: {
      fromSynap: { groupId },
    },
    include: {
      fromSynap: {
        select: { id: true, summary: true, tags: true, content: true, createdAt: true },
      },
      toSynap: {
        select: { id: true, summary: true, tags: true, content: true, createdAt: true },
      },
      author: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(connections);
}

// POST: 새로운 연결(유추) 생성 — 사용자가 직접 synap을 연결
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
  const { fromSynapId, toSynapId, insight } = body;

  if (!fromSynapId || !toSynapId || !insight) {
    return NextResponse.json(
      { error: "두 개의 Synap과 발견한 연결 설명이 필요합니다." },
      { status: 400 }
    );
  }

  if (fromSynapId === toSynapId) {
    return NextResponse.json(
      { error: "서로 다른 Synap을 선택해주세요." },
      { status: 400 }
    );
  }

  const connection = await prisma.synapConnection.create({
    data: {
      fromSynapId,
      toSynapId,
      insight,
      authorId: (session.user as { id: string }).id,
    },
    include: {
      fromSynap: { select: { id: true, summary: true, tags: true } },
      toSynap: { select: { id: true, summary: true, tags: true } },
      author: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(connection, { status: 201 });
}
