"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { JlptWord, JlptWordData, JlptLevel, WordPOS, POS_OPTIONS } from "@/types/word";
import { WordDetailModal } from "@/components/WordDetailModal";
import { loadReviewData, loadReviewDataSync, addItemsToReview } from "@/services/reviewService";

export default function WordsLearnPage() {
  const [wordData, setWordData] = useState<JlptWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<JlptWord | null>(null);
  const [levelFilter, setLevelFilter] = useState<JlptLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<WordPOS | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToReview, setAddedToReview] = useState(false);

  // 전체를 복습에 추가
  const handleAddAllToReview = async () => {
    const data = await loadReviewData();
    const items = filteredWords.map(w => ({ id: w.id, type: "word" as const }));
    await addItemsToReview(data, items);
    setAddedToReview(true);
    setTimeout(() => setAddedToReview(false), 2000);
  };

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/jlpt_words_detail.json");
        const data: JlptWordData = await response.json();
        setWordData(data.words);
      } catch (error) {
        console.error("Failed to load word data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // JLPT 레벨 목록
  const levels: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  // 카테고리(품사) 목록 추출
  const categories = useMemo(() => {
    const cats = new Set<WordPOS>();
    wordData.forEach(w => cats.add(w.category));
    return Array.from(cats);
  }, [wordData]);

  // 필터링
  const filteredWords = useMemo(() => {
    let result = wordData;

    if (levelFilter !== "all") {
      result = result.filter(w => w.jlpt === levelFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter(w => w.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.word.toLowerCase().includes(query) ||
        w.reading.toLowerCase().includes(query) ||
        w.meaning.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.frequency - b.frequency);
  }, [wordData, levelFilter, categoryFilter, searchQuery]);

  const levelColors: Record<string, string> = {
    "N5": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "N4": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "N3": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "N2": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "N1": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const categoryColors: Record<string, string> = {
    "동사": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "명사": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "い형용사": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "な형용사": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "부사": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "조사": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    "접속사": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "감탄사": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/learn" className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  <span className="text-blue-600 dark:text-blue-400">単語</span> 학습
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? "로딩 중..." : `${filteredWords.length}개의 단어`}
                </p>
              </div>
            </div>
            {/* 복습 추가 버튼 */}
            {!isLoading && filteredWords.length > 0 && (
              <button
                onClick={handleAddAllToReview}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  addedToReview
                    ? "bg-green-500 text-white"
                    : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                }`}
              >
                {addedToReview ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    추가됨!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    전체 복습
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 필터 바 */}
      <div className="sticky top-[57px] z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="단어, 읽기, 뜻 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* JLPT 레벨 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setLevelFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                levelFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              전체
            </button>
            {levels.map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  levelFilter === level
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* 품사 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              모든 품사
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 단어 목록 */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredWords.map((word) => (
              <button
                key={word.id}
                onClick={() => setSelectedWord(word)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[word.jlpt] || "bg-gray-100 text-gray-700"}`}>
                        {word.jlpt}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[word.category] || "bg-gray-100 text-gray-700"}`}>
                        {word.category}
                      </span>
                      {word.verbType && (
                        <span className="text-xs text-gray-400">{word.verbType}</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {word.word}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {word.reading}
                      </span>
                    </div>
                    <p className="text-blue-600 dark:text-blue-400 mt-1">
                      {word.meaning}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
