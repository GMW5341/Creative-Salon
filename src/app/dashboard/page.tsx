"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  _count: { members: number; meetings: number; books: number };
  creator: { name: string };
  books: { title: string; author: string }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/groups")
        .then((r) => r.json())
        .then(setGroups)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-500 mt-1">
            안녕하세요, {session?.user?.name}님!
          </p>
        </div>
        <Link
          href="/groups/new"
          className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition"
        >
          새 모임 만들기
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            아직 참여 중인 모임이 없습니다
          </h2>
          <p className="text-gray-500 mb-6">
            새 모임을 만들거나, 초대 링크를 통해 모임에 참여하세요.
          </p>
          <Link
            href="/groups/new"
            className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition inline-block"
          >
            첫 모임 만들기
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition block"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {group.name}
              </h3>
              {group.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}
              {group.books[0] && (
                <div className="bg-amber-50 rounded-lg px-3 py-2 mb-4">
                  <p className="text-xs text-amber-600 font-medium">현재 읽는 책</p>
                  <p className="text-sm text-amber-800 font-medium">
                    {group.books[0].title}
                  </p>
                </div>
              )}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>멤버 {group._count.members}명</span>
                <span>모임 {group._count.meetings}회</span>
                <span>도서 {group._count.books}권</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
