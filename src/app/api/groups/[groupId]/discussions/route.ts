import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const discussions = await prisma.discussion.findMany({
      where: { groupId: params.groupId },
      include: {
        author: { select: { name: true, profileImage: true } },
        book: { select: { title: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(discussions);
  } catch {
    return NextResponse.json({ error: "토론 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { title, content, category, bookId, meetingId } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
    }

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category: category || "GENERAL",
        authorId: user.id,
        groupId: params.groupId,
        bookId,
        meetingId,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json(discussion, { status: 201 });
  } catch {
    return NextResponse.json({ error: "토론 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
