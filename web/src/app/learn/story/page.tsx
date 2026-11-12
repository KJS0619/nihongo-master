"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { StoryMeta, StoryDifficulty, DIFFICULTY_COLORS } from "@/types/story";

export default function StoryListPage() {
  const [stories, setStories] = useState<StoryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<StoryDifficulty | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadStories() {
      try {
        const response = await fetch("/data/stories/index.json");
        const data = await response.json();
        setStories(data.stories);
      } catch (error) {
        console.error("Failed to load stories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStories();
  }, []);

  const filteredStories = useMemo(() => {
    let result = stories;

    if (difficultyFilter !== "all") {
      result = result.filter((s) => s.difficulty === difficultyFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((s) =>
        s.title.toLowerCase().includes(query) ||
        s.titleKo.toLowerCase().includes(query) ||
        s.themes.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [stories, difficultyFilter, searchQuery]);

  const difficulties: (StoryDifficulty | "all")[] = ["all", "N5", "N4", "N3", "N2", "N1"];

  return (
    <div className="min-h-screen pb-20">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/learn" className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                <span className="text-amber-600 dark:text-amber-400">昔話</span> 이야기
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">옛날이야기로 배우는 일본어</p>
            </div>
          </div>
        </div>
      </header>

      {/* 필터 */}
      <div className="sticky top-[57px] z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="이야기 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 난이도 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {difficulties.map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  difficultyFilter === diff
                    ? diff === "all"
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : `${DIFFICULTY_COLORS[diff]} text-white`
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {diff === "all" ? "전체" : diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 이야기 목록 */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>이야기를 찾을 수 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StoryCard({ story }: { story: StoryMeta }) {
  return (
    <Link
      href={`/learn/story/${story.id}`}
      className="block bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
    >
      <div className="flex gap-4">
        {/* 커버 이미지 또는 플레이스홀더 */}
        <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {story.coverImage ? (
            <img src={story.coverImage} alt={story.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl">📖</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {story.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {story.titleKo}
              </p>
            </div>
            <span className={`px-2 py-0.5 ${DIFFICULTY_COLORS[story.difficulty]} text-white text-xs font-medium rounded-full flex-shrink-0`}>
              {story.difficulty}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {story.summary}
          </p>

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {story.estimatedMinutes}분
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {story.sentenceCount}문장
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {story.vocabularyCount}단어
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {story.themes.slice(0, 3).map((theme) => (
              <span
                key={theme}
                className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
