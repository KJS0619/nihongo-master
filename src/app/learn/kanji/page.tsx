"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Kanji, KanjiData, JlptLevel, GradeFilter } from "@/types/kanji";
import { FilterBar } from "@/components/FilterBar";
import { KanjiGrid } from "@/components/KanjiGrid";
import { KanjiModal } from "@/components/KanjiModal";
import { FlashcardModal } from "@/components/FlashcardModal";
import { WordFlashcardModal } from "@/components/WordFlashcardModal";
import { TopicKanjiModal } from "@/components/TopicKanjiModal";
import { RadicalModal } from "@/components/RadicalModal";
import { RadicalKanjiModal } from "@/components/RadicalKanjiModal";
import { KanjiDiffModal } from "@/components/KanjiDiffModal";
import { KokujiModal } from "@/components/KokujiModal";
import { ReviewTestModal } from "@/components/ReviewTestModal";
import { loadReviewData, addItemsToReview } from "@/services/reviewService";

export default function KanjiLearnPage() {
  const [kanjiData, setKanjiData] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKanji, setSelectedKanji] = useState<Kanji | null>(null);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [showWordFlashcard, setShowWordFlashcard] = useState(false);
  const [showTopicKanji, setShowTopicKanji] = useState(false);
  const [showRadical, setShowRadical] = useState(false);
  const [showRadicalKanji, setShowRadicalKanji] = useState(false);
  const [showKanjiDiff, setShowKanjiDiff] = useState(false);
  const [showKokuji, setShowKokuji] = useState(false);
  const [showReviewTest, setShowReviewTest] = useState(false);
  const [addedToReview, setAddedToReview] = useState(false);

  // 전체를 복습에 추가
  const handleAddAllToReview = () => {
    const data = loadReviewData();
    const items = filteredKanji.map(k => ({ id: k.literal, type: "kanji" as const }));
    addItemsToReview(data, items);
    setAddedToReview(true);
    setTimeout(() => setAddedToReview(false), 2000);
  };

  // 필터 상태
  const [jlptFilter, setJlptFilter] = useState<JlptLevel>("all");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/kanji_master.json");
        const data: KanjiData = await response.json();
        setKanjiData(data.kanji);
      } catch (error) {
        console.error("Failed to load kanji data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 필터링된 데이터
  const filteredKanji = useMemo(() => {
    let result = kanjiData;

    // JLPT 필터
    if (jlptFilter !== "all") {
      result = result.filter((k) => k.jlpt_level === jlptFilter);
    }

    // 학년 필터
    if (gradeFilter !== "all") {
      result = result.filter((k) => k.grade === gradeFilter);
    }

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((k) => {
        if (k.literal.includes(query)) return true;
        if (k.korean_hun_eum?.toLowerCase().includes(query)) return true;
        if (k.ja_on.some((r) => r.toLowerCase().includes(query))) return true;
        if (k.ja_kun.some((r) => r.toLowerCase().includes(query))) return true;
        if (k.meanings_en.some((m) => m.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    return result;
  }, [kanjiData, jlptFilter, gradeFilter, searchQuery]);

  // 통계
  const stats = useMemo(() => {
    const jlptCounts: Record<string, number> = {
      N5: 0,
      N4: 0,
      N3: 0,
      N2: 0,
      N1: 0,
    };
    kanjiData.forEach((k) => {
      if (jlptCounts[k.jlpt_level] !== undefined) {
        jlptCounts[k.jlpt_level]++;
      }
    });
    return {
      total: kanjiData.length,
      jlpt: jlptCounts,
    };
  }, [kanjiData]);

  const toolButtons = [
    { label: "플래시카드", icon: "🎴", onClick: () => setShowFlashcard(true), gradient: "from-blue-500 to-indigo-500" },
    { label: "단어 암기", icon: "📖", onClick: () => setShowWordFlashcard(true), gradient: "from-green-500 to-teal-500" },
    { label: "주제별", icon: "📚", onClick: () => setShowTopicKanji(true), gradient: "from-red-500 to-orange-500" },
    { label: "부수 214", icon: "🀄", onClick: () => setShowRadical(true), gradient: "from-purple-500 to-pink-500" },
    { label: "부수별", icon: "🔤", onClick: () => setShowRadicalKanji(true), gradient: "from-teal-500 to-cyan-500" },
    { label: "한·일 차이", icon: "🔄", onClick: () => setShowKanjiDiff(true), gradient: "from-blue-500 to-purple-500" },
    { label: "국자", icon: "🇯🇵", onClick: () => setShowKokuji(true), gradient: "from-orange-500 to-red-500" },
    { label: "복습 테스트", icon: "🧠", onClick: () => setShowReviewTest(true), gradient: "from-emerald-500 to-green-500" },
    {
      label: addedToReview ? "추가됨!" : `전체 복습 (${filteredKanji.length})`,
      icon: addedToReview ? "✅" : "➕",
      onClick: handleAddAllToReview,
      gradient: addedToReview ? "from-green-500 to-green-600" : "from-red-500 to-pink-500"
    },
  ];

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="text-red-600 dark:text-red-400">漢字</span> 학습
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">상용한자 {stats.total.toLocaleString()}자</p>
            </div>
          </div>
        </div>
      </header>

      {/* 도구 버튼들 */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {toolButtons.map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap bg-gradient-to-r ${btn.gradient} text-white`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <FilterBar
        jlptFilter={jlptFilter}
        gradeFilter={gradeFilter}
        searchQuery={searchQuery}
        jlptCounts={stats.jlpt}
        onJlptChange={setJlptFilter}
        onGradeChange={setGradeFilter}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1 px-2 sm:px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 px-2">
              {filteredKanji.length === stats.total
                ? `전체 ${stats.total}자`
                : `${filteredKanji.length}자 / ${stats.total}자`}
            </div>
            <KanjiGrid
              kanjiList={filteredKanji}
              onKanjiClick={setSelectedKanji}
            />
          </>
        )}
      </main>

      {selectedKanji && (
        <KanjiModal
          kanji={selectedKanji}
          onClose={() => setSelectedKanji(null)}
        />
      )}

      {showFlashcard && (
        <FlashcardModal
          kanjiList={kanjiData}
          onClose={() => setShowFlashcard(false)}
        />
      )}

      {showWordFlashcard && (
        <WordFlashcardModal
          onClose={() => setShowWordFlashcard(false)}
        />
      )}

      {showTopicKanji && (
        <TopicKanjiModal
          onClose={() => setShowTopicKanji(false)}
        />
      )}

      {showRadical && (
        <RadicalModal
          onClose={() => setShowRadical(false)}
        />
      )}

      {showRadicalKanji && (
        <RadicalKanjiModal
          kanjiList={kanjiData}
          onClose={() => setShowRadicalKanji(false)}
        />
      )}

      {showKanjiDiff && (
        <KanjiDiffModal
          onClose={() => setShowKanjiDiff(false)}
        />
      )}

      {showKokuji && (
        <KokujiModal
          onClose={() => setShowKokuji(false)}
        />
      )}

      {showReviewTest && (
        <ReviewTestModal
          onClose={() => setShowReviewTest(false)}
        />
      )}
    </div>
  );
}
