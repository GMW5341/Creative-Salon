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

    const resources = await prisma.resource.findMany({
      where: { groupId: params.groupId },
      include: {
        uploader: { select: { name: true } },
        book: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({ error: "자료를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
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

    const { title, description, type, url, content, tags, bookId } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "제목을 입력해주세요." }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        type: type || "DOCUMENT",
        url,
        content,
        tags: tags ? JSON.stringify(tags) : null,
        uploaderId: user.id,
        groupId: params.groupId,
        bookId,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch {
    return NextResponse.json({ error: "자료 등록 중 오류가 발생했습니다." }, { status: 500 });
  }
}
