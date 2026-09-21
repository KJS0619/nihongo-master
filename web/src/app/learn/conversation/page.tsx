"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Conversation, ConversationData, ConversationCategory } from "@/types/conversation";
import { ConversationDetailModal } from "@/components/ConversationDetailModal";

export default function ConversationLearnPage() {
  const [conversationData, setConversationData] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ConversationCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/conversation.json");
        const data: ConversationData = await response.json();
        setConversationData(data.conversations);
      } catch (error) {
        console.error("Failed to load conversation data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // 카테고리 목록 추출
  const categories = useMemo(() => {
    const cats = new Set<ConversationCategory>();
    conversationData.forEach(c => cats.add(c.category));
    return Array.from(cats);
  }, [conversationData]);

  // 필터링
  const filteredConversations = useMemo(() => {
    let result = conversationData;

    if (categoryFilter !== "all") {
      result = result.filter(c => c.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.titleJa.toLowerCase().includes(query) ||
        c.situation.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.difficulty - b.difficulty);
  }, [conversationData, categoryFilter, searchQuery]);

  const categoryColors: Record<string, string> = {
    "인사": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "쇼핑": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    "식당": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "길찾기": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "전화": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "사과/감사": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "일상": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "비즈니스": "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300",
    "여행": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "의료": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const difficultyStars = (level: number) => {
    return "⭐".repeat(level) + "☆".repeat(5 - level);
  };

  return (
    <div className="min-h-screen">
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
                <span className="text-green-600 dark:text-green-400">会話</span> 학습
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLoading ? "로딩 중..." : `${filteredConversations.length}개의 회화`}
              </p>
            </div>
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
              placeholder="상황 또는 제목 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:ring-2 focus:ring-green-500 dark:text-white"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              전체
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 회화 목록 */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-2xl flex-shrink-0">
                    {conv.thumbnail}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[conv.category] || "bg-gray-100 text-gray-700"}`}>
                        {conv.category}
                      </span>
                      <span className="text-xs text-gray-400">{conv.jlpt}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-0.5">
                      {conv.title}
                      <span className="text-gray-400 dark:text-gray-500 font-normal ml-2 text-sm">
                        {conv.titleJa}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {conv.situation}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{difficultyStars(conv.difficulty)}</span>
                      <span>약 {conv.estimatedTime}분</span>
                      <span>{conv.dialogue.length}문장</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* 상세 모달 */}
      {selectedConversation && (
        <ConversationDetailModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
