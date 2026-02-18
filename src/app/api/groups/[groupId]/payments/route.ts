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

    const payments = await prisma.payment.findMany({
      where: { groupId: params.groupId },
      include: {
        user: { select: { name: true, email: true } },
        fee: { select: { name: true, period: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const fees = await prisma.groupFee.findMany({
      where: { groupId: params.groupId, isActive: true },
    });

    return NextResponse.json({ payments, fees });
  } catch {
    return NextResponse.json({ error: "결제 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
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

    const body = await req.json();

    // 회비 설정 생성
    if (body.action === "CREATE_FEE") {
      const { name, amount, period } = body;
      const fee = await prisma.groupFee.create({
        data: {
          name,
          amount,
          period: period || "MONTHLY",
          groupId: params.groupId,
        },
      });
      return NextResponse.json(fee, { status: 201 });
    }

    // 결제 기록 생성
    const { amount, method, memo, feeId, userId: targetUserId } = body;
    const payment = await prisma.payment.create({
      data: {
        amount,
        method,
        memo,
        status: "COMPLETED",
        paidAt: new Date(),
        userId: targetUserId || user.id,
        groupId: params.groupId,
        feeId,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "결제 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
