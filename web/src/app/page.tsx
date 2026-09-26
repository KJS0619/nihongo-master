"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StudyStats {
  todayReview: number;
  streak: number;
  totalKanji: number;
  learnedKanji: number;
  totalWords: number;
  learnedWords: number;
  totalGrammar: number;
  totalConversation: number;
}

interface RecentItem {
  type: "kanji" | "word" | "grammar";
  content: string;
  reading?: string;
  meaning: string;
  timestamp: number;
}

export default function Home() {
  const [stats, setStats] = useState<StudyStats>({
    todayReview: 0,
    streak: 0,
    totalKanji: 2136,
    learnedKanji: 0,
    totalWords: 4463,
    learnedWords: 0,
    totalGrammar: 360,
    totalConversation: 50,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 다크 모드 초기화
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode !== null
      ? savedDarkMode === "true"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // 학습 통계 로드
  useEffect(() => {
    // localStorage에서 학습 진도 로드
    const learnedKanji = JSON.parse(localStorage.getItem("learnedKanji") || "[]");
    const customWords = JSON.parse(localStorage.getItem("customWords") || "[]");
    const streak = parseInt(localStorage.getItem("studyStreak") || "0");
    const todayReview = parseInt(localStorage.getItem("todayReview") || "0");

    setStats(prev => ({
      ...prev,
      learnedKanji: learnedKanji.length,
      learnedWords: customWords.length,
      streak,
      todayReview,
    }));

    // 최근 학습 항목
    const recent = JSON.parse(localStorage.getItem("recentStudy") || "[]");
    setRecentItems(recent.slice(0, 5));
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("darkMode", String(newValue));
      if (newValue) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newValue;
    });
  };

  const studyCategories = [
    {
      href: "/learn/kanji",
      title: "한자",
      subtitle: "漢字",
      icon: "🀄",
      count: `${stats.totalKanji.toLocaleString()}자`,
      gradient: "from-red-500 to-orange-500",
    },
    {
      href: "/learn/words",
      title: "단어",
      subtitle: "単語",
      icon: "📚",
      count: `${stats.totalWords.toLocaleString()}개`,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      href: "/learn/grammar",
      title: "문법",
      subtitle: "文法",
      icon: "📝",
      count: `${stats.totalGrammar}개`,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      href: "/learn/conversation",
      title: "회화",
      subtitle: "会話",
      icon: "💬",
      count: `${stats.totalConversation}개`,
      gradient: "from-green-500 to-teal-500",
    },
  ];

  const jlptLevels = [
    { level: "N5", total: 80, learned: 0, color: "bg-green-500" },
    { level: "N4", total: 166, learned: 0, color: "bg-blue-500" },
    { level: "N3", total: 367, learned: 0, color: "bg-yellow-500" },
    { level: "N2", total: 380, learned: 0, color: "bg-orange-500" },
    { level: "N1", total: 1143, learned: 0, color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇯🇵</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                <span className="text-blue-600 dark:text-blue-400">日本語</span>マスター
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">한국인을 위한 일본어</p>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* 오늘의 학습 현황 */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="text-sm font-medium opacity-90 mb-3">오늘의 학습</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.todayReview}</p>
                <p className="text-xs opacity-80">복습 완료</p>
              </div>
              <div className="w-px h-10 bg-white/30"></div>
              <div className="text-center">
                <p className="text-3xl font-bold">{stats.streak}</p>
                <p className="text-xs opacity-80">연속 학습일</p>
              </div>
            </div>
            <Link
              href="/review"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              복습하기 →
            </Link>
          </div>
        </section>

        {/* 학습하기 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">학습하기</h2>
          <div className="grid grid-cols-2 gap-3">
            {studyCategories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl mb-2`}>
                  {cat.icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cat.subtitle}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* JLPT 학습 진도 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">JLPT 한자 진도</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            {jlptLevels.map((level) => (
              <div key={level.level}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{level.level}</span>
                  <span className="text-gray-500 dark:text-gray-400">{level.learned}/{level.total}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${level.color} transition-all duration-500`}
                    style={{ width: `${(level.learned / level.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 최근 학습 */}
        {recentItems.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">최근 학습</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
              {recentItems.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center gap-3">
                  <span className="text-2xl">{item.content}</span>
                  <div className="flex-1 min-w-0">
                    {item.reading && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.reading}</p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.meaning}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.type === "kanji" ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" :
                    item.type === "word" ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300" :
                    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
                  }`}>
                    {item.type === "kanji" ? "한자" : item.type === "word" ? "단어" : "문법"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 빠른 접근 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">빠른 접근</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/learn/kanji"
              className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              🎴 플래시카드
            </Link>
            <Link
              href="/learn/kanji"
              className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              🀄 부수 214
            </Link>
            <Link
              href="/learn/kanji"
              className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              🔄 한·일 차이
            </Link>
            <Link
              href="/notes"
              className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
            >
              📚 내 단어장
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
