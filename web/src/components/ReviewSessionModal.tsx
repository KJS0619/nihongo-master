"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewSessionItem, ReviewDifficulty, ReviewItemType } from "@/types/review";
import {
  loadReviewData,
  loadReviewDataSync,
  saveReviewResult,
  getDueItems,
} from "@/services/reviewService";
import { JlptWord, JlptWordData } from "@/types/word";
import { Grammar, GrammarData } from "@/types/grammar";
import { Kanji, KanjiData } from "@/types/kanji";

interface ReviewSessionModalProps {
  type: ReviewItemType;
  onClose: () => void;
  onComplete: (completed: number, correct: number) => void;
}

export function ReviewSessionModal({ type, onClose, onComplete }: ReviewSessionModalProps) {
  const [items, setItems] = useState<ReviewSessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [completedCount, setCompletedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  // 데이터 로드
  useEffect(() => {
    async function loadItems() {
      setIsLoading(true);
      const reviewData = await loadReviewData();
      const dueItems = getDueItems(reviewData, type);

      if (dueItems.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // 타입별로 원본 데이터 로드
      const sessionItems: ReviewSessionItem[] = [];

      if (type === "word") {
        try {
          const response = await fetch("/data/jlpt_words_detail.json");
          const data: JlptWordData = await response.json();
          const wordMap = new Map(data.words.map(w => [w.id, w]));

          for (const due of dueItems) {
            const word = wordMap.get(due.id);
            if (word) {
              sessionItems.push({
                id: word.id,
                type: "word",
                front: {
                  primary: word.word,
                  secondary: word.reading,
                },
                back: {
                  primary: word.meaning,
                  secondary: word.meaningDetail,
                  examples: word.examples.map(e => e.ja),
                },
                progress: reviewData.progress[`word:${word.id}`],
              });
            }
          }
        } catch (error) {
          console.error("Failed to load word data:", error);
        }
      } else if (type === "grammar") {
        try {
          const response = await fetch("/data/grammar_n5.json");
          const data: GrammarData = await response.json();
          const grammarMap = new Map(data.grammar.map(g => [g.id, g]));

          for (const due of dueItems) {
            const grammar = grammarMap.get(due.id);
            if (grammar) {
              sessionItems.push({
                id: grammar.id,
                type: "grammar",
                front: {
                  primary: grammar.pattern,
                  secondary: grammar.patternReading,
                },
                back: {
                  primary: grammar.meaning,
                  secondary: grammar.explanation.summary,
                  examples: grammar.examples.map(e => e.ja),
                },
                progress: reviewData.progress[`grammar:${grammar.id}`],
              });
            }
          }
        } catch (error) {
          console.error("Failed to load grammar data:", error);
        }
      } else if (type === "kanji") {
        try {
          const response = await fetch("/data/kanji_master.json");
          const data: KanjiData = await response.json();
          const kanjiMap = new Map(data.kanji.map(k => [k.literal, k]));

          for (const due of dueItems) {
            const kanji = kanjiMap.get(due.id);
            if (kanji) {
              sessionItems.push({
                id: kanji.literal,
                type: "kanji",
                front: {
                  primary: kanji.literal,
                  secondary: kanji.korean_hun_eum || "",
                },
                back: {
                  primary: kanji.korean_hun_eum || kanji.meanings_en.join(", "),
                  secondary: `音: ${kanji.ja_on.join(", ")} / 訓: ${kanji.ja_kun.join(", ")}`,
                  examples: kanji.meanings_en,
                },
                progress: reviewData.progress[`kanji:${kanji.literal}`],
              });
            }
          }
        } catch (error) {
          console.error("Failed to load kanji data:", error);
        }
      }

      // 랜덤 셔플
      sessionItems.sort(() => Math.random() - 0.5);
      setItems(sessionItems);
      setIsLoading(false);
    }

    loadItems();
  }, [type]);

  // 정답 공개
  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true);
  }, []);

  // 난이도 선택
  const handleDifficulty = useCallback(async (difficulty: ReviewDifficulty) => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];
    const reviewData = await loadReviewData();
    await saveReviewResult(reviewData, currentItem.id, currentItem.type, difficulty);

    setCompletedCount(prev => prev + 1);
    if (difficulty !== "again") {
      setCorrectCount(prev => prev + 1);
    }

    // 다음 아이템
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
      setStartTime(Date.now());
    } else {
      // 세션 완료
      onComplete(completedCount + 1, correctCount + (difficulty !== "again" ? 1 : 0));
    }
  }, [items, currentIndex, completedCount, correctCount, onComplete]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showAnswer) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleShowAnswer();
        }
      } else {
        switch (e.key) {
          case "1":
            handleDifficulty("again");
            break;
          case "2":
            handleDifficulty("hard");
            break;
          case "3":
            handleDifficulty("good");
            break;
          case "4":
            handleDifficulty("easy");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, handleShowAnswer, handleDifficulty]);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex) / items.length) * 100;

  const typeLabels: Record<ReviewItemType, string> = {
    word: "단어",
    grammar: "문법",
    kanji: "한자",
  };

  const typeColors: Record<ReviewItemType, string> = {
    word: "from-blue-500 to-cyan-500",
    grammar: "from-purple-500 to-pink-500",
    kanji: "from-red-500 to-orange-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[type]} flex items-center justify-center`}>
                <span className="text-white text-sm">
                  {type === "word" ? "📚" : type === "grammar" ? "📝" : "🀄"}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {typeLabels[type]} 복습
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 진행 바 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${typeColors[type]} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                복습할 항목이 없습니다
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                새로운 항목을 학습해 보세요!
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
              >
                닫기
              </button>
            </div>
          ) : (
            <>
              {/* 카드 앞면 */}
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentItem.front.primary}
                </p>
                {currentItem.front.secondary && (
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    {currentItem.front.secondary}
                  </p>
                )}
              </div>

              {/* 정답 표시 */}
              {showAnswer ? (
                <div className="space-y-4">
                  {/* 카드 뒷면 */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                      {currentItem.back.primary}
                    </p>
                    {currentItem.back.secondary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {currentItem.back.secondary}
                      </p>
                    )}
                  </div>

                  {/* 예문 */}
                  {currentItem.back.examples && currentItem.back.examples.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">예문</p>
                      <p className="text-gray-900 dark:text-white">
                        {currentItem.back.examples[0]}
                      </p>
                    </div>
                  )}

                  {/* 난이도 버튼 */}
                  <div className="grid grid-cols-4 gap-2 mt-6">
                    <button
                      onClick={() => handleDifficulty("again")}
                      className="py-3 px-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <span className="block text-lg mb-1">😵</span>
                      다시
                      <span className="block text-xs opacity-70">1</span>
                    </button>
                    <button
                      onClick={() => handleDifficulty("hard")}
                      className="py-3 px-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      <span className="block text-lg mb-1">😓</span>
                      어려움
                      <span className="block text-xs opacity-70">2</span>
                    </button>
                    <button
                      onClick={() => handleDifficulty("good")}
                      className="py-3 px-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <span className="block text-lg mb-1">😊</span>
                      적당
                      <span className="block text-xs opacity-70">3</span>
                    </button>
                    <button
                      onClick={() => handleDifficulty("easy")}
                      className="py-3 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <span className="block text-lg mb-1">😎</span>
                      쉬움
                      <span className="block text-xs opacity-70">4</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleShowAnswer}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-lg transition-colors"
                >
                  정답 보기
                  <span className="block text-sm opacity-70 mt-1">Space 또는 Enter</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* 진행 상태 */}
        {!isLoading && items.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>완료: {completedCount}</span>
              <span>•</span>
              <span>정답률: {completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
