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

    const meetings = await prisma.meeting.findMany({
      where: { groupId: params.groupId },
      include: {
        book: { select: { title: true, author: true } },
        _count: { select: { notes: true, discussions: true, attendances: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(meetings);
  } catch {
    return NextResponse.json({ error: "모임 목록을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
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

    const { title, description, date, location, type, bookId } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ error: "제목과 날짜는 필수입니다." }, { status: 400 });
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        date: new Date(date),
        location,
        type: type || "OFFLINE",
        groupId: params.groupId,
        bookId,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch {
    return NextResponse.json({ error: "모임 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
