"use client";

import Link from "next/link";

export default function LearnPage() {
  const categories = [
    {
      href: "/learn/kanji",
      title: "한자",
      subtitle: "漢字",
      description: "상용한자 2,136자 완전정복",
      icon: "🀄",
      count: "2,136자",
      gradient: "from-red-500 to-orange-500",
      features: ["JLPT N5~N1", "획순 애니메이션", "부수 214", "한일 자형 비교"],
    },
    {
      href: "/learn/words",
      title: "단어",
      subtitle: "単語",
      description: "JLPT 필수 단어 10,000개",
      icon: "📚",
      count: "10,000단어",
      gradient: "from-blue-500 to-cyan-500",
      features: ["JLPT N5~N1", "품사별 분류", "예문 학습", "나만의 단어장"],
    },
    {
      href: "/learn/grammar",
      title: "문법",
      subtitle: "文法",
      description: "체계적인 일본어 문법",
      icon: "📝",
      count: "준비중",
      gradient: "from-purple-500 to-pink-500",
      features: ["JLPT 레벨별", "한국어 비교", "패턴 연습", "실전 문제"],
    },
    {
      href: "/learn/conversation",
      title: "회화",
      subtitle: "会話",
      description: "실전 회화 패턴",
      icon: "💬",
      count: "준비중",
      gradient: "from-green-500 to-teal-500",
      features: ["상황별 회화", "롤플레이", "섀도잉", "청취 연습"],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">학습</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">카테고리를 선택하세요</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {categories.map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="block bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{cat.title}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{cat.subtitle}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{cat.description}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{cat.count}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {cat.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}
