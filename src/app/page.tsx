import Link from "next/link";

export default function Home() {
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
            모임의 대화에서 인사이트를 추출하고, 시간이 지나도 사라지지 않는
            사고의 조각(Dot)으로 만드세요. 연결은 당신이 만듭니다.
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
              title: "음성 기록 & Dot 추출",
              desc: "대화를 음성으로 기록하면 AI가 인사이트 조각(Dot)을 자동으로 추출합니다. 더 이상 대화가 휘발되지 않습니다.",
              icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
            },
            {
              title: "Dot Board & 유추",
              desc: "축적된 Dot들을 살펴보고, 직접 연결하세요. 당신의 유추가 새로운 Dot이 되어 집단 사고를 확장합니다.",
              icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
            },
            {
              title: "토론 & 커뮤니티",
              desc: "책, 생각, 질문을 나누고 댓글로 깊이 있는 대화를 이어갑니다. 모든 토론에서 Dot이 태어납니다.",
              icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
            },
            {
              title: "모임 관리",
              desc: "오프라인/온라인 모임 일정을 관리하고, 출석 체크와 모임 기록을 한 곳에서 처리합니다.",
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            },
            {
              title: "자료실",
              desc: "독서 자료, 발제문, 참고 링크를 한곳에 모아 모임의 가치 있는 자산으로 축적합니다.",
              icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
            },
            {
              title: "회원 & 결제 관리",
              desc: "초대 링크로 멤버를 모으고, 모임비를 체계적으로 관리합니다.",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
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

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Dot이 연결되는 과정
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "대화를 기록한다",
                desc: "모임에서 음성 녹음을 시작하세요. 브라우저가 대화를 실시간으로 텍스트로 변환합니다.",
              },
              {
                step: "2",
                title: "AI가 Dot을 추출한다",
                desc: "대화에서 유의미한 인사이트 조각(Dot)이 자동으로 추출되어 Dot Board에 쌓입니다.",
              },
              {
                step: "3",
                title: "당신이 연결한다",
                desc: "시간이 지나며 쌓인 Dot들 사이에서 유추를 발견하세요. 그 연결 자체가 새로운 Dot이 됩니다.",
              },
              {
                step: "4",
                title: "집단 사고가 진화한다",
                desc: "개인의 Dot, 그룹의 Dot, 연결된 유추가 모여 살아있는 지식 생태계가 탄생합니다.",
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

      {/* Pricing */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
          요금제
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Dot이 쌓일수록 가치가 커집니다
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              plan: "Free",
              price: "0",
              period: "",
              desc: "시작하기",
              features: [
                "월 2회 모임 기록",
                "Dot 추출 (월 30개)",
                "최근 30일 Dot 열람",
                "기본 모임 관리",
              ],
              cta: "무료로 시작",
              highlight: false,
            },
            {
              plan: "Group Pro",
              price: "9,900",
              period: "/월",
              desc: "모임 운영자를 위한",
              features: [
                "무제한 모임 기록",
                "무제한 Dot 추출",
                "전체 Dot 아카이브",
                "그룹 Dot Board",
                "유추 연결 기능",
                "음성 녹음 무제한",
              ],
              cta: "시작하기",
              highlight: true,
            },
            {
              plan: "Personal Pro",
              price: "4,900",
              period: "/월",
              desc: "개인 사고의 확장",
              features: [
                "여러 그룹 Dot 통합",
                "개인 사고 지도",
                "그룹 교차 Dot 열람",
                "전체 아카이브 검색",
              ],
              cta: "시작하기",
              highlight: false,
            },
          ].map((tier) => (
            <div
              key={tier.plan}
              className={`rounded-2xl p-6 ${
                tier.highlight
                  ? "bg-amber-600 text-white ring-2 ring-amber-600 ring-offset-2"
                  : "bg-white border border-gray-200"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  tier.highlight ? "text-amber-100" : "text-gray-500"
                }`}
              >
                {tier.desc}
              </p>
              <h3
                className={`text-xl font-bold mb-2 ${
                  tier.highlight ? "text-white" : "text-gray-900"
                }`}
              >
                {tier.plan}
              </h3>
              <p className="mb-6">
                <span
                  className={`text-3xl font-bold ${
                    tier.highlight ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.price === "0" ? "무료" : `${tier.price}원`}
                </span>
                {tier.period && (
                  <span
                    className={`text-sm ${
                      tier.highlight ? "text-amber-100" : "text-gray-500"
                    }`}
                  >
                    {tier.period}
                  </span>
                )}
              </p>
              <ul className="space-y-2 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <svg
                      className={`w-4 h-4 ${
                        tier.highlight ? "text-amber-200" : "text-amber-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center py-2.5 rounded-lg font-medium text-sm transition ${
                  tier.highlight
                    ? "bg-white text-amber-700 hover:bg-amber-50"
                    : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-amber-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            유의미한 대화를 시작하세요
          </h2>
          <p className="text-amber-100 mb-8">
            모든 대화에는 연결되기를 기다리는 Dot이 있습니다.
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
