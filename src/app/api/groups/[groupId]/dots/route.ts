import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: 그룹의 모든 dot 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;

  const dots = await prisma.dot.findMany({
    where: { groupId },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
      meeting: { select: { id: true, title: true, date: true } },
      discussion: { select: { id: true, title: true } },
      connectionsFrom: {
        include: {
          toDot: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
      connectionsTo: {
        include: {
          fromDot: { select: { id: true, summary: true, tags: true } },
          author: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(dots);
}

// POST: 새 dot 수동 생성
export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { groupId } = params;
  const body = await request.json();
  const { content, summary, tags, source, meetingId, discussionId } = body;

  if (!content || !summary) {
    return NextResponse.json(
      { error: "내용과 요약은 필수입니다." },
      { status: 400 }
    );
  }

  const dot = await prisma.dot.create({
    data: {
      content,
      summary,
      tags: tags ? JSON.stringify(tags) : null,
      source: source || "MANUAL",
      authorId: (session.user as { id: string }).id,
      groupId,
      meetingId: meetingId || null,
      discussionId: discussionId || null,
    },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
    },
  });

  return NextResponse.json(dot, { status: 201 });
}
