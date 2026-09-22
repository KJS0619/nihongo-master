"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Grammar, GrammarData, JlptGrammarLevel, GrammarCategory } from "@/types/grammar";
import { GrammarDetailModal } from "@/components/GrammarDetailModal";
import { loadReviewData, loadReviewDataSync, addItemsToReview } from "@/services/reviewService";

export default function GrammarLearnPage() {
  const [grammarData, setGrammarData] = useState<Grammar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrammar, setSelectedGrammar] = useState<Grammar | null>(null);
  const [levelFilter, setLevelFilter] = useState<JlptGrammarLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<GrammarCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addedToReview, setAddedToReview] = useState(false);

  // 전체를 복습에 추가
  const handleAddAllToReview = async () => {
    const data = await loadReviewData();
    const items = filteredGrammar.map(g => ({ id: g.id, type: "grammar" as const }));
    await addItemsToReview(data, items);
    setAddedToReview(true);
    setTimeout(() => setAddedToReview(false), 2000);
  };

  // 데이터 로드 (N5 + N4)
  useEffect(() => {
    async function loadData() {
      try {
        const [n5Response, n4Response] = await Promise.all([
          fetch("/data/grammar_n5.json"),
          fetch("/data/grammar_n4.json")
        ]);

        const n5Data: GrammarData = await n5Response.json();
        const n4Data: GrammarData = await n4Response.json();

        // N5, N4 문법 합치기
        const allGrammar = [...n5Data.grammar, ...n4Data.grammar];
        setGrammarData(allGrammar);
      } catch (error) {
        console.error("Failed to load grammar data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const cats = new Set<GrammarCategory>();
    grammarData.forEach(g => cats.add(g.category));
    return Array.from(cats);
  }, [grammarData]);

  // 필터링
  const filteredGrammar = useMemo(() => {
    let result = grammarData;

    if (levelFilter !== "all") {
      result = result.filter(g => g.jlpt === levelFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter(g => g.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.pattern.toLowerCase().includes(query) ||
        g.meaning.toLowerCase().includes(query) ||
        g.explanation.summary.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.order - b.order);
  }, [grammarData, levelFilter, categoryFilter, searchQuery]);

  const categoryColors: Record<string, string> = {
    // N5 카테고리
    "기본문형": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "부정": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "존재": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "동사": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "이동": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "희망": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "의뢰": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "진행/상태": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "과거": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "이유": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    // N4 카테고리
    "가능": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "수수표현": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "조건": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    "역접": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    "접속": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    "추측": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "전문": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    "의지": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "경험": "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300",
    "결정": "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300",
    "노력": "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300",
    "변화": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "목적": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "원인": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "완료": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "준비": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "상태": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "시도": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "사역": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "수동": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "사역수동": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "인용": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "의견": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "의문": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    "비교": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    "한정": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    "시점": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "빈도": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    "주제": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "수단": "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300",
    "관점": "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300",
    "대상": "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300",
    "경어": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "열거": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "의무": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "불필요": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "당위": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "금지": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "습관": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "규칙": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "논리": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "부분부정": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "강한부정": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "시작": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "계속": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    "정도": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "난이도": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "사과": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "감정": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    "방법": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    "범위": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    "시간": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "기한": "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300",
    "대체": "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-300",
    "직후": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "지시": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "전형": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "경향": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "명사화": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    "양보": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
    "방식": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
    "배분": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    "자격": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    "비례": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "본성": "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300",
    "감탄": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "무익": "bg-neutral-100 text-neutral-700 dark:bg-neutral-900/30 dark:text-neutral-300",
    "계기": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "후회": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "미완료": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "재시행": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "상호": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "부정의지": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    "결과": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "진행": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "전달": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "정의": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "강조": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
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
                  <span className="text-purple-600 dark:text-purple-400">文法</span> 학습
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isLoading ? "로딩 중..." : `${filteredGrammar.length}개의 문법`}
                </p>
              </div>
            </div>
            {/* 복습 추가 버튼 */}
            {!isLoading && filteredGrammar.length > 0 && (
              <button
                onClick={handleAddAllToReview}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  addedToReview
                    ? "bg-green-500 text-white"
                    : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50"
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
              placeholder="문법 패턴 또는 의미 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
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
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              전체 레벨
            </button>
            {(["N5", "N4", "N3", "N2", "N1"] as JlptGrammarLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  levelFilter === level
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              전체 카테고리
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

      {/* 문법 목록 */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredGrammar.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGrammar.map((grammar) => (
              <button
                key={grammar.id}
                onClick={() => setSelectedGrammar(grammar)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[grammar.category] || "bg-gray-100 text-gray-700"}`}>
                        {grammar.category}
                      </span>
                      <span className="text-xs text-gray-400">{grammar.jlpt}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {grammar.pattern}
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
                      {grammar.meaning}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {grammar.explanation.summary}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 text-sm font-bold">
                      {grammar.order}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3">
                  {grammar.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selectedGrammar && (
        <GrammarDetailModal
          grammar={selectedGrammar}
          onClose={() => setSelectedGrammar(null)}
        />
      )}
    </div>
  );
}
