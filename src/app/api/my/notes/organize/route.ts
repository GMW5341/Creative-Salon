import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { organizeNotesWithAI } from "@/lib/ai";

// POST: AI로 메모 자동 분류
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // 모든 메모 가져오기
  const notes = await prisma.personalNote.findMany({
    where: { userId },
    select: { id: true, content: true, title: true, type: true, tags: true },
    orderBy: { createdAt: "desc" },
  });

  if (notes.length === 0) {
    return NextResponse.json({ error: "분류할 메모가 없습니다." }, { status: 400 });
  }

  // 기존 폴더 목록
  const existingFolders = await prisma.noteFolder.findMany({
    where: { userId },
    select: { id: true, name: true, description: true },
  });

  // AI로 분류
  const result = await organizeNotesWithAI(notes, existingFolders);

  // 트랜잭션으로 폴더 생성 + 메모 이동
  const createdFolders: Array<{ id: string; name: string; noteCount: number }> = [];

  await prisma.$transaction(async (tx) => {
    // 먼저 모든 메모의 folderId를 null로 초기화
    await tx.personalNote.updateMany({
      where: { userId },
      data: { folderId: null },
    });

    for (const folderData of result.folders) {
      if (folderData.noteIds.length === 0) continue;

      // 기존 폴더 이름과 매칭 시 재사용
      const existing = existingFolders.find((f) => f.name === folderData.name);
      let folderId: string;

      if (existing) {
        folderId = existing.id;
        // 설명과 색상 업데이트
        await tx.noteFolder.update({
          where: { id: folderId },
          data: {
            description: folderData.description,
            color: folderData.color,
          },
        });
      } else {
        const folder = await tx.noteFolder.create({
          data: {
            name: folderData.name,
            description: folderData.description,
            color: folderData.color,
            userId,
          },
        });
        folderId = folder.id;
      }

      // 메모를 해당 폴더에 배치
      await tx.personalNote.updateMany({
        where: {
          id: { in: folderData.noteIds },
          userId, // 보안: 본인 메모만
        },
        data: { folderId },
      });

      createdFolders.push({
        id: folderId,
        name: folderData.name,
        noteCount: folderData.noteIds.length,
      });
    }

    // 사용하지 않는 기존 빈 폴더 정리
    const usedFolderIds = createdFolders.map((f) => f.id);
    const emptyOldFolders = existingFolders.filter((f) => !usedFolderIds.includes(f.id));
    for (const emptyFolder of emptyOldFolders) {
      const count = await tx.personalNote.count({ where: { folderId: emptyFolder.id } });
      if (count === 0) {
        await tx.noteFolder.delete({ where: { id: emptyFolder.id } });
      }
    }
  });

  return NextResponse.json({
    success: true,
    folders: createdFolders,
    totalNotes: notes.length,
  });
}
