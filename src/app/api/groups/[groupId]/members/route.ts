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

    const members = await prisma.groupMember.findMany({
      where: { groupId: params.groupId },
      include: {
        user: { select: { id: true, name: true, email: true, profileImage: true, bio: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch {
    return NextResponse.json({ error: "멤버 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { memberId } = await req.json();

    const currentMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.groupId } },
    });

    if (!currentMember || currentMember.role !== "ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.groupMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "멤버 삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
