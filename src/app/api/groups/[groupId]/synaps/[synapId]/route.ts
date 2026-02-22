import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 단일 synap 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { groupId: string; synapId: string } }
) {
  const synap = await prisma.synap.findUnique({
    where: { id: params.synapId },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
      meeting: { select: { id: true, title: true, date: true } },
      discussion: { select: { id: true, title: true } },
      connectionsFrom: {
        include: {
          toSynap: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
      connectionsTo: {
        include: {
          fromSynap: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
    },
  });

  if (!synap) {
    return NextResponse.json({ error: "Synap을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json(synap);
}

// PUT: synap 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string; synapId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const { content, summary, tags } = body;

  const synap = await prisma.synap.findUnique({
    where: { id: params.synapId },
  });

  if (!synap) {
    return NextResponse.json({ error: "Synap을 찾을 수 없습니다." }, { status: 404 });
  }

  const updated = await prisma.synap.update({
    where: { id: params.synapId },
    data: {
      ...(content !== undefined && { content }),
      ...(summary !== undefined && { summary }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
      meeting: { select: { id: true, title: true, date: true } },
      discussion: { select: { id: true, title: true } },
      connectionsFrom: {
        include: {
          toSynap: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
      connectionsTo: {
        include: {
          fromSynap: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}

// DELETE: synap 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { groupId: string; synapId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const synap = await prisma.synap.findUnique({
    where: { id: params.synapId },
  });

  if (!synap) {
    return NextResponse.json({ error: "Synap을 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.synap.delete({ where: { id: params.synapId } });

  return NextResponse.json({ success: true });
}
