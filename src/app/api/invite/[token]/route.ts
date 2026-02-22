import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// 초대 정보 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
      include: {
        group: { select: { name: true } },
        inviter: { select: { name: true } },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "유효하지 않은 초대입니다." }, { status: 404 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "이미 처리된 초대입니다." }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: "초대가 만료되었습니다." }, { status: 400 });
    }

    return NextResponse.json({
      groupName: invitation.group.name,
      inviterName: invitation.inviter.name,
    });
  } catch {
    return NextResponse.json({ error: "초대 정보를 불러올 수 없습니다." }, { status: 500 });
  }
}

// 초대 수락
export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token: params.token },
    });

    if (!invitation || invitation.status !== "PENDING") {
      return NextResponse.json({ error: "유효하지 않은 초대입니다." }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "초대가 만료되었습니다." }, { status: 400 });
    }

    // 이미 멤버인지 확인
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: invitation.groupId } },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 모임 멤버입니다.", groupId: invitation.groupId }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.groupMember.create({
        data: {
          userId: user.id,
          groupId: invitation.groupId,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      }),
    ]);

    return NextResponse.json({ success: true, groupId: invitation.groupId });
  } catch {
    return NextResponse.json({ error: "초대 수락 중 오류가 발생했습니다." }, { status: 500 });
  }
}
