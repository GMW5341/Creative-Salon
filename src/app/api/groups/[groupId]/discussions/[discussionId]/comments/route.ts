import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { groupId: string; discussionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      where: { discussionId: params.discussionId, parentId: null },
      include: {
        author: { select: { name: true, profileImage: true } },
        replies: {
          include: {
            author: { select: { name: true, profileImage: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch {
    return NextResponse.json({ error: "댓글을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string; discussionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { content, parentId } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        discussionId: params.discussionId,
        parentId,
      },
      include: {
        author: { select: { name: true, profileImage: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "댓글 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
