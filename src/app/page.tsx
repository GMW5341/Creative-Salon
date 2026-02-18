import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            함께 읽고, 함께 성장하는
            <br />
            <span className="text-amber-700">독서 커뮤니티</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            모임의 대화를 기록하고, 자료를 축적하며, 의미 있는 커뮤니티로
            발전시키세요. Creative Salon이 독서모임을 비즈니스로 성장시키는
            플랫폼이 되어드립니다.
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

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          주요 기능
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "모임 기록 & 아카이빙",
              desc: "매 모임의 토론 내용, 핵심 인사이트, 액션 아이템을 체계적으로 기록하고 보관합니다.",
              icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
            },
            {
              title: "토론 & 커뮤니티",
              desc: "책에 대한 리뷰, 질문, 추천을 나누고 댓글로 깊이 있는 대화를 이어갑니다.",
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            },
            {
              title: "자료실",
              desc: "독서 자료, 발제문, 참고 링크를 한곳에 모아 모임의 가치 있는 자산으로 축적합니다.",
              icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
            },
            {
              title: "회원 관리",
              desc: "초대 링크로 새 멤버를 받고, 역할을 관리하며 건강한 커뮤니티를 운영합니다.",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
            },
            {
              title: "결제 & 회비",
              desc: "모임비 설정, 납부 현황 추적, 결제 내역 관리를 한눈에 처리합니다.",
              icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
            },
            {
              title: "일정 관리",
              desc: "정기 모임 일정을 관리하고, 출석을 체크하며, 다가오는 모임을 알림으로 받습니다.",
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-amber-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={feature.icon}
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 독서모임을 시작하세요
          </h2>
          <p className="text-amber-100 mb-8">
            5명의 소규모 모임부터 대규모 커뮤니티까지, Creative Salon과 함께
            성장하세요.
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
          <p>&copy; 2024 Creative Salon. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
