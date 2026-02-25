"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // 로그인된 사용자는 나의 뇌로 리다이렉트
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/my");
    }
  }, [status, router]);

  // 로딩 중이거나 인증된 사용자는 최소 UI
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            대화는 휘발되지만
            <br />
            <span className="text-amber-700">사고는 연결되면 살아남는다</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            떠오르는 생각을 기록하고, 모임의 대화에서 인사이트를 발견하세요.
            당신의 뇌가 되어줄 개인 저장소와, 함께 사고를 확장할 모임 공간이 여기 있습니다.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            powered by <span className="font-semibold text-amber-700">Synap</span> engine
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-amber-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-amber-700 transition"
            >
              시작하기
            </Link>
            <Link
              href="/login"
              className="border border-amber-600 text-amber-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-amber-50 transition"
            >
              로그인
            </Link>
          </div>
        </div>
      </section>

      {/* What is Creative Salon */}
      <section className="py-20 max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          Creative Salon이란?
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-2xl mx-auto">
          나의 생각을 기록하고, 모임에서 대화하고, 그 안에서 연결을 발견하는 플랫폼입니다.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 나의 뇌 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">나의 뇌</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              메모, 글, 인용, 아이디어, 성찰, 질문 &mdash; 떠오르는 모든 생각을 한곳에 기록합니다.
              이 기록들이 모여 당신만의 뇌가 됩니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                6가지 타입의 기록 (메모, 글, 인용, 아이디어, 성찰, 질문)
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                검색, 필터링, 고정 기능
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                나만의 개인 저장소
              </li>
            </ul>
          </div>

          {/* 모임 */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-5">
              <svg className="w-7 h-7 text-orange-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">모임</h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              독서모임이나 스터디 그룹을 만들고, 대화에서 인사이트를 발견하세요.
              Synap Board에서 생각의 조각들을 연결하며 집단 사고가 확장됩니다.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                음성 기록 & 인사이트 추출
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Synap Board & 사고 연결
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                토론, 자료실, 일정 관리
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            어떻게 사용하나요?
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "생각을 기록한다",
                desc: "떠오르는 생각, 읽은 문장, 질문, 아이디어를 '나의 뇌'에 자유롭게 기록하세요.",
              },
              {
                step: "2",
                title: "모임에서 대화한다",
                desc: "모임을 만들고, 대화를 음성으로 기록하거나 직접 작성하세요. ThoughtBrancher로 문장에서 파생되는 생각을 발견합니다.",
              },
              {
                step: "3",
                title: "연결을 발견한다",
                desc: "시간이 지나며 쌓인 인사이트(Synap)들 사이에서 유추를 발견하세요. 그 연결 자체가 새로운 통찰이 됩니다.",
              },
              {
                step: "4",
                title: "사고가 확장된다",
                desc: "개인의 기록과 모임의 대화가 만나, 혼자서는 도달하지 못했을 생각에 이릅니다.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            당신의 뇌를 시작하세요
          </h2>
          <p className="text-amber-100 mb-8">
            기록하고, 대화하고, 연결하세요. 모든 생각은 가치가 있습니다.
          </p>
          <Link
            href="/register"
            className="bg-white text-amber-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-amber-50 transition inline-block"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>&copy; 2025 Creative Salon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
