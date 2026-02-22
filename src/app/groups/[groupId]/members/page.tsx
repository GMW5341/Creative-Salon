"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import ParticleLoader from "@/components/ParticleLoader";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
    bio: string | null;
  };
}

export default function MembersPage() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/groups/${groupId}/members`)
      .then((r) => r.json())
      .then(setMembers)
      .finally(() => setLoading(false));
  }, [groupId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setMessage("");

    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`${inviteEmail}님에게 초대를 보냈습니다.`);
      setInviteEmail("");
    } else {
      setMessage(data.error);
    }
    setInviting(false);
  }

  const roleLabel: Record<string, string> = {
    ADMIN: "관리자",
    MODERATOR: "운영진",
    MEMBER: "멤버",
  };

  if (loading) {
    return <ParticleLoader />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/groups/${groupId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition mb-4"
      >
        &larr; 그룹으로 돌아가기
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">멤버 관리</h1>

      {/* Invite Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          새 멤버 초대
        </h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            placeholder="초대할 이메일 주소"
            required
          />
          <button
            type="submit"
            disabled={inviting}
            className="bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 transition whitespace-nowrap"
          >
            {inviting ? "초대 중..." : "초대하기"}
          </button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-amber-700">{message}</p>
        )}
      </div>

      {/* Member List */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            멤버 ({members.length}명)
          </h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">
                  {member.user.name[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.user.name}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    member.role === "ADMIN"
                      ? "bg-amber-100 text-amber-700"
                      : member.role === "MODERATOR"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {roleLabel[member.role] || member.role}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(member.joinedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
