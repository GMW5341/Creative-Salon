"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Meeting {
  id: string;
  title: string;
  date: string;
  status: string;
  type: string;
  location: string | null;
  book: { title: string; author: string } | null;
  _count: { notes: number; discussions: number; attendances: number };
}

interface Discussion {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  author: { name: string };
  _count: { comments: number };
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [activeTab, setActiveTab] = useState<"meetings" | "discussions">("meetings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/groups/${groupId}/meetings`).then((r) => r.json()),
      fetch(`/api/groups/${groupId}/discussions`).then((r) => r.json()),
    ])
      .then(([m, d]) => {
        setMeetings(m);
        setDiscussions(d);
      })
      .finally(() => setLoading(false));
  }, [groupId]);

  const statusLabel: Record<string, string> = {
    SCHEDULED: "예정",
    IN_PROGRESS: "진행 중",
    COMPLETED: "완료",
    CANCELLED: "취소",
  };

  const categoryLabel: Record<string, string> = {
    GENERAL: "자유",
    BOOK_REVIEW: "서평",
    QUESTION: "질문",
    RECOMMENDATION: "추천",
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  const tabs = [
    { id: "meetings" as const, label: "모임", count: meetings.length },
    { id: "discussions" as const, label: "토론", count: discussions.length },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href={`/groups/${groupId}/synaps`}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
        >
          Synap Board
        </Link>
        <Link
          href={`/groups/${groupId}/members`}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          멤버 관리
        </Link>
        <Link
          href={`/groups/${groupId}/resources`}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          자료실
        </Link>
        <Link
          href={`/groups/${groupId}/payments`}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
        >
          결제 관리
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Meetings Tab */}
      {activeTab === "meetings" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">모임 일정</h2>
            <Link
              href={`/groups/${groupId}/meetings/new`}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
            >
              새 모임 만들기
            </Link>
          </div>
          {meetings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              아직 예정된 모임이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((meeting) => (
                <Link
                  key={meeting.id}
                  href={`/groups/${groupId}/meetings/${meeting.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition block"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(meeting.date).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {meeting.book && (
                        <p className="text-sm text-amber-700 mt-1">
                          {meeting.book.title} - {meeting.book.author}
                        </p>
                      )}
                      {meeting.location && (
                        <p className="text-xs text-gray-400 mt-1">
                          {meeting.location}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          meeting.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : meeting.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : meeting.status === "CANCELLED"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {statusLabel[meeting.status] || meeting.status}
                      </span>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>노트 {meeting._count.notes}</span>
                        <span>출석 {meeting._count.attendances}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === "discussions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">토론</h2>
            <Link
              href={`/groups/${groupId}/discussions/new`}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition"
            >
              새 토론 시작
            </Link>
          </div>
          {discussions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              아직 토론이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {discussions.map((d) => (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {categoryLabel[d.category] || d.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {d.author.name}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900">{d.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400">
                      댓글 {d._count.comments}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
