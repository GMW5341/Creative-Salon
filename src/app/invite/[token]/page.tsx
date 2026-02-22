"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const token = params.token as string;

  const [state, setState] = useState<"loading" | "ready" | "accepting" | "success" | "error">("loading");
  const [invitation, setInvitation] = useState<{ groupName: string; inviterName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 초대 정보 조회
  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState("error");
          setErrorMsg(data.error);
        } else {
          setInvitation(data);
          setState("ready");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("초대 정보를 불러올 수 없습니다.");
      });
  }, [token]);

  async function handleAccept() {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    setState("accepting");

    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
    });

    const data = await res.json();

    if (res.ok) {
      setState("success");
      setTimeout(() => router.push(`/groups/${data.groupId}`), 2000);
    } else {
      setState("error");
      setErrorMsg(data.error);
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
        {state === "loading" && (
          <p className="text-gray-500">초대 정보를 확인하는 중...</p>
        )}

        {state === "ready" && invitation && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">모임 초대</h1>
            <p className="text-gray-600 mb-6">
              <strong>{invitation.inviterName}</strong>님이{" "}
              <strong>&ldquo;{invitation.groupName}&rdquo;</strong> 모임에 초대했습니다.
            </p>
            <button
              onClick={handleAccept}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
            >
              {status === "unauthenticated" ? "로그인 후 수락하기" : "초대 수락하기"}
            </button>
          </>
        )}

        {state === "accepting" && (
          <p className="text-gray-500">초대를 수락하는 중...</p>
        )}

        {state === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">환영합니다!</h1>
            <p className="text-gray-600">모임 페이지로 이동합니다...</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">초대 오류</h1>
            <p className="text-gray-600 mb-6">{errorMsg}</p>
            <Link
              href="/"
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              홈으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
