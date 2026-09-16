"use client";

import { useState, useEffect } from "react";
import { ReviewItemType, ReviewStats } from "@/types/review";
import {
  loadReviewData,
  refreshStats,
  getDueCount,
  getWeeklyData,
  getDayName,
  addItemsToReview,
} from "@/services/reviewService";
import { ReviewSessionModal } from "@/components/ReviewSessionModal";

export default function ReviewPage() {
  const [stats, setStats] = useState<ReviewStats>({
    todayDue: 0,
    todayCompleted: 0,
    streak: 0,
    totalMastered: 0,
    accuracy: 0,
    lastStudyDate: null,
  });
  const [dueCounts, setDueCounts] = useState<Record<ReviewItemType, number>>({
    word: 0,
    grammar: 0,
    kanji: 0,
  });
  const [weeklyData, setWeeklyData] = useState<{ date: string; count: number }[]>([]);
  const [activeSession, setActiveSession] = useState<ReviewItemType | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const data = loadReviewData();
    const refreshed = refreshStats(data);

    setStats(refreshed.stats);
    setDueCounts({
      word: getDueCount(refreshed, "word"),
      grammar: getDueCount(refreshed, "grammar"),
      kanji: getDueCount(refreshed, "kanji"),
    });
    setWeeklyData(getWeeklyData(refreshed));
  }, []);

  // 세션 완료 핸들러
  const handleSessionComplete = (completed: number, correct: number) => {
    setActiveSession(null);

    // 통계 새로고침
    const data = loadReviewData();
    setStats(data.stats);
    setDueCounts({
      word: getDueCount(data, "word"),
      grammar: getDueCount(data, "grammar"),
      kanji: getDueCount(data, "kanji"),
    });
    setWeeklyData(getWeeklyData(data));
  };

  // 샘플 아이템 추가 (데모용)
  const handleAddSampleItems = async () => {
    const data = loadReviewData();

    // 단어 데이터에서 처음 5개 추가
    try {
      const wordRes = await fetch("/data/jlpt_words_detail.json");
      const wordData = await wordRes.json();
      const wordItems = wordData.words.slice(0, 5).map((w: { id: string }) => ({
        id: w.id,
        type: "word" as ReviewItemType,
      }));

      // 문법 데이터에서 처음 5개 추가
      const grammarRes = await fetch("/data/grammar_n5.json");
      const grammarData = await grammarRes.json();
      const grammarItems = grammarData.grammar.slice(0, 5).map((g: { id: string }) => ({
        id: g.id,
        type: "grammar" as ReviewItemType,
      }));

      const updated = addItemsToReview(data, [...wordItems, ...grammarItems]);

      setStats(updated.stats);
      setDueCounts({
        word: getDueCount(updated, "word"),
        grammar: getDueCount(updated, "grammar"),
        kanji: getDueCount(updated, "kanji"),
      });

      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to add sample items:", error);
    }
  };

  const reviewCategories = [
    {
      id: "word" as ReviewItemType,
      title: "단어 복습",
      icon: "📚",
      count: dueCounts.word,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "grammar" as ReviewItemType,
      title: "문법 복습",
      icon: "📝",
      count: dueCounts.grammar,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "kanji" as ReviewItemType,
      title: "한자 복습",
      icon: "🀄",
      count: dueCounts.kanji,
      gradient: "from-red-500 to-orange-500",
    },
  ];

  const totalDue = dueCounts.word + dueCounts.grammar + dueCounts.kanji;
  const maxWeeklyCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">복습</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">간격 반복 학습으로 장기 기억하기</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* 오늘의 복습 현황 */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="text-sm font-medium opacity-90 mb-4">오늘의 복습</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{totalDue}</p>
              <p className="text-xs opacity-80">대기중</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.todayCompleted}</p>
              <p className="text-xs opacity-80">완료</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.streak}</p>
              <p className="text-xs opacity-80">연속일</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.accuracy}%</p>
              <p className="text-xs opacity-80">정답률</p>
            </div>
          </div>
        </section>

        {/* 복습 시작 */}
        {totalDue > 0 ? (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">복습 시작</h2>
            <div className="space-y-3">
              {reviewCategories.filter(cat => cat.count > 0).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveSession(cat.id)}
                  className="w-full bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex items-center gap-4"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-2xl`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900 dark:text-white">{cat.title}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{cat.count}개 복습 대기</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}

              {/* 전체 복습 버튼 */}
              <button
                onClick={() => setActiveSession("word")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 text-white"
              >
                <span className="text-2xl">🚀</span>
                <span className="font-bold">전체 복습 시작 ({totalDue}개)</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {stats.todayCompleted > 0 ? "오늘 복습 완료!" : "복습할 항목이 없습니다"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {stats.todayCompleted > 0
                ? "대단해요! 내일 또 만나요"
                : "학습 페이지에서 새로운 항목을 공부해 보세요"}
            </p>

            {/* 샘플 추가 버튼 (복습 항목이 없을 때) */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              샘플 항목 추가하기
            </button>
          </section>
        )}

        {/* 마스터 현황 */}
        {stats.totalMastered > 0 && (
          <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-2xl">
                🏆
              </div>
              <div>
                <h3 className="font-bold text-amber-900 dark:text-amber-100">마스터 달성!</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {stats.totalMastered}개의 항목을 완전히 익혔어요
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SRS 설명 */}
        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>🧠</span>
            간격 반복 학습 (SRS)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            SM-2 알고리즘으로 효율적으로 암기하세요. 쉬운 항목은 간격이 늘어나고,
            어려운 항목은 더 자주 복습합니다. 21일 이상 기억하면 마스터!
          </p>
        </section>

        {/* 복습 통계 */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">이번 주 학습</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-end h-32">
              {weeklyData.map((day, idx) => (
                <div key={day.date} className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`w-6 rounded-t-lg transition-all ${
                      day.count > 0
                        ? "bg-gradient-to-t from-green-500 to-emerald-400"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                    style={{
                      height: day.count > 0
                        ? `${Math.max(20, (day.count / maxWeeklyCount) * 80)}px`
                        : "8px",
                    }}
                  ></div>
                  <div className="text-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">
                      {getDayName(day.date)}
                    </span>
                    {day.count > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {day.count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 단축키 안내 */}
        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span>⌨️</span>
            키보드 단축키
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd>
              <span>정답 보기</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">1</kbd>
              <span>다시</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">2</kbd>
              <span>어려움</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">3</kbd>
              <span>적당</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">4</kbd>
              <span>쉬움</span>
            </div>
          </div>
        </section>
      </main>

      {/* 복습 세션 모달 */}
      {activeSession && (
        <ReviewSessionModal
          type={activeSession}
          onClose={() => setActiveSession(null)}
          onComplete={handleSessionComplete}
        />
      )}

      {/* 샘플 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              샘플 항목 추가
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              단어 5개와 문법 5개를 복습 목록에 추가합니다.
              실제로는 학습 페이지에서 공부한 항목이 자동으로 추가됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleAddSampleItems}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
