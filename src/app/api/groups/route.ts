import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId: user.id } },
      },
      include: {
        _count: { select: { members: true, meetings: true, books: true } },
        creator: { select: { name: true } },
        books: { where: { status: "READING" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(groups);
  } catch {
    return NextResponse.json({ error: "그룹 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { name, description, isPublic, maxMembers } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "모임 이름을 입력해주세요." }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description,
        isPublic: isPublic ?? true,
        maxMembers: maxMembers ?? 20,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json({ error: "모임 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
