import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    }

    // 이미 멤버인지 확인
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: existingUser.id, groupId: params.groupId } },
      });
      if (existingMember) {
        return NextResponse.json({ error: "이미 모임 멤버입니다." }, { status: 409 });
      }
    }

    const invitation = await prisma.invitation.create({
      data: {
        email,
        groupId: params.groupId,
        inviterId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "초대 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// 초대 수락
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { token } = await req.json();

    const invitation = await prisma.invitation.findUnique({ where: { token } });
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
