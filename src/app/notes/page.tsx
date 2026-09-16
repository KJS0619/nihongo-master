"use client";

import { useState, useEffect } from "react";
import { Kanji, KanjiData } from "@/types/kanji";
import { MyVocabModal } from "@/components/MyVocabModal";
import { JlptExplainerModal } from "@/components/JlptExplainerModal";

export default function NotesPage() {
  const [kanjiData, setKanjiData] = useState<Kanji[]>([]);
  const [showMyVocab, setShowMyVocab] = useState(false);
  const [showJlptExplainer, setShowJlptExplainer] = useState(false);
  const [customWordCount, setCustomWordCount] = useState(0);

  useEffect(() => {
    // 한자 데이터 로드
    async function loadData() {
      try {
        const response = await fetch("/data/kanji_master.json");
        const data: KanjiData = await response.json();
        setKanjiData(data.kanji);
      } catch (error) {
        console.error("Failed to load kanji data:", error);
      }
    }
    loadData();

    // 커스텀 단어 개수 로드
    const words = JSON.parse(localStorage.getItem("customWords") || "[]");
    setCustomWordCount(words.length);
  }, []);

  const noteCategories = [
    {
      id: "vocab",
      title: "나만의 단어장",
      description: "직접 추가한 단어들",
      icon: "📚",
      count: `${customWordCount}개`,
      gradient: "from-orange-500 to-amber-500",
      onClick: () => setShowMyVocab(true),
    },
    {
      id: "jlpt",
      title: "JLPT 해설 생성기",
      description: "문제 해설 자동 생성",
      icon: "📝",
      count: "AI 도우미",
      gradient: "from-violet-500 to-purple-500",
      onClick: () => setShowJlptExplainer(true),
    },
    {
      id: "bookmark",
      title: "북마크",
      description: "저장한 한자/단어",
      icon: "⭐",
      count: "0개",
      gradient: "from-yellow-500 to-orange-500",
      onClick: () => {},
    },
    {
      id: "wrong",
      title: "오답 노트",
      description: "틀린 문제 모음",
      icon: "❌",
      count: "0개",
      gradient: "from-red-500 to-pink-500",
      onClick: () => {},
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">노트</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">나만의 학습 자료</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {noteCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={cat.onClick}
            className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl`}>
              {cat.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-gray-900 dark:text-white">{cat.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{cat.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{cat.count}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}

        {/* 학습 팁 */}
        <section className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <span>💡</span>
            학습 팁
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            나만의 단어장에 모르는 단어를 추가하고,
            JLPT 해설 생성기로 문제를 분석해보세요.
            효과적인 학습의 시작입니다!
          </p>
        </section>
      </main>

      {showMyVocab && (
        <MyVocabModal
          kanjiList={kanjiData}
          onClose={() => setShowMyVocab(false)}
        />
      )}

      {showJlptExplainer && (
        <JlptExplainerModal
          onClose={() => setShowJlptExplainer(false)}
        />
      )}
    </div>
  );
}
