"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Kanji, KanjiData } from "@/types/kanji";
import { LearningPlan, DailySession, LearningStats } from "@/types/learningPlan";
import {
  loadPlan,
  savePlan,
  loadStats,
  refreshStats,
  loadDailySession,
  createDailySession,
  getDueReviewCount,
  calculateEstimatedCompletion,
  getWeeklyStats,
} from "@/services/learningPlanService";
import { LearningSessionModal } from "@/components/kanji-room/LearningSessionModal";
import { SettingsModal } from "@/components/kanji-room/SettingsModal";
import { StatsCard } from "@/components/kanji-room/StatsCard";

export default function KanjiRoomPage() {
  const [kanjiData, setKanjiData] = useState<Kanji[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<LearningPlan | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [session, setSession] = useState<DailySession | null>(null);
  const [showSession, setShowSession] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessionType, setSessionType] = useState<"new" | "review" | "all">("all");

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/data/kanji_master.json");
        const data: KanjiData = await response.json();
        setKanjiData(data.kanji);

        // 학습 계획 및 통계 로드
        const loadedPlan = loadPlan();
        const loadedStats = refreshStats();
        setPlan(loadedPlan);
        setStats(loadedStats);

        // 오늘 세션 로드 또는 생성
        let todaySession = loadDailySession();
        if (!todaySession) {
          // JLPT 필터링된 한자 목록
          const filteredKanji = data.kanji
            .filter((k) => {
              if (loadedPlan.jlptLevel === "all") return true;
              return k.jlpt_level === loadedPlan.jlptLevel;
            })
            .map((k) => k.literal);
          todaySession = createDailySession(filteredKanji, loadedPlan);
        }
        setSession(todaySession);
      } catch (error) {
        console.error("Failed to load kanji data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // JLPT 필터링된 한자
  const filteredKanji = useMemo(() => {
    if (!plan) return kanjiData;
    if (plan.jlptLevel === "all") return kanjiData;
    return kanjiData.filter((k) => k.jlpt_level === plan.jlptLevel);
  }, [kanjiData, plan]);

  // 예상 완료일
  const estimation = useMemo(() => {
    if (!plan || !stats) return null;
    return calculateEstimatedCompletion(plan, stats);
  }, [plan, stats]);

  // 오늘 진행률
  const todayProgress = useMemo(() => {
    if (!session) return { completed: 0, total: 0, percent: 0 };
    const completed = session.completedNew.length + session.completedReview.length;
    const total = session.newKanji.length + session.reviewKanji.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [session]);

  // 학습 시작
  const handleStartLearning = (type: "new" | "review" | "all") => {
    setSessionType(type);
    setShowSession(true);
  };

  // 세션 완료/종료
  const handleSessionClose = () => {
    setShowSession(false);
    // 세션 및 통계 새로고침
    const updatedSession = loadDailySession();
    const updatedStats = refreshStats();
    setSession(updatedSession);
    setStats(updatedStats);
  };

  // 설정 저장
  const handleSaveSettings = (newPlan: LearningPlan) => {
    savePlan(newPlan);
    setPlan(newPlan);
    setShowSettings(false);

    // 세션 재생성
    const filteredKanji = kanjiData
      .filter((k) => {
        if (newPlan.jlptLevel === "all") return true;
        return k.jlpt_level === newPlan.jlptLevel;
      })
      .map((k) => k.literal);
    const newSession = createDailySession(filteredKanji, newPlan);
    setSession(newSession);
  };

  // 복습 필요 한자 수
  const dueReviewCount = useMemo(() => getDueReviewCount(), [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/learn" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">한자 학습실</h1>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 오늘의 목표 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              오늘도 한자 공부! 📚
            </h2>
            {stats && stats.currentStreak > 0 && (
              <p className="text-orange-500 font-medium">
                🔥 {stats.currentStreak}일 연속 학습 중!
              </p>
            )}
          </div>

          {/* 신규/복습 카드 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleStartLearning("new")}
              disabled={!session || session.newKanji.length === 0}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl font-bold mb-1">
                {session?.newKanji.length || 0}자
              </div>
              <div className="text-sm opacity-90">신규 학습</div>
              {session && session.completedNew.length > 0 && (
                <div className="text-xs mt-1 opacity-75">
                  {session.completedNew.length}개 완료
                </div>
              )}
            </button>
            <button
              onClick={() => handleStartLearning("review")}
              disabled={!session || session.reviewKanji.length === 0}
              className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl font-bold mb-1">
                {session?.reviewKanji.length || 0}자
              </div>
              <div className="text-sm opacity-90">복습</div>
              {session && session.completedReview.length > 0 && (
                <div className="text-xs mt-1 opacity-75">
                  {session.completedReview.length}개 완료
                </div>
              )}
            </button>
          </div>

          {/* 오늘 진행률 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">오늘의 진행률</span>
              <span className="font-medium text-gray-800">
                {todayProgress.completed} / {todayProgress.total}
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${todayProgress.percent}%` }}
              />
            </div>
            <div className="text-right text-sm text-gray-500 mt-1">
              {todayProgress.percent}%
            </div>
          </div>

          {/* 학습 시작 버튼 */}
          <button
            onClick={() => handleStartLearning("all")}
            disabled={todayProgress.total === 0}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📚 오늘의 학습 시작
          </button>
        </div>

        {/* 누적 현황 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📊 누적 현황</h3>

          <div className="space-y-4">
            {/* 전체 진도 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">전체 진도</span>
                <span className="font-medium">
                  {stats?.totalLearned || 0} / {plan?.targetKanji || 2000}자
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${
                      plan ? ((stats?.totalLearned || 0) / plan.targetKanji) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* 암기 완료 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">암기 완료</span>
                <span className="font-medium text-green-600">
                  {stats?.totalMastered || 0}자
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      stats?.totalLearned
                        ? (stats.totalMastered / stats.totalLearned) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* 통계 그리드 */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {stats?.accuracy || 0}%
                </div>
                <div className="text-xs text-gray-500">정답률</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {stats?.currentStreak || 0}일
                </div>
                <div className="text-xs text-gray-500">연속 학습</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {dueReviewCount}자
                </div>
                <div className="text-xs text-gray-500">복습 대기</div>
              </div>
            </div>
          </div>
        </div>

        {/* 주간 학습 통계 */}
        <StatsCard />

        {/* 예상 완료일 */}
        {estimation && stats && stats.totalLearned < (plan?.targetKanji || 2000) && (
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl p-4 text-center">
            <p className="text-sm text-gray-600">
              하루 {plan?.dailyNewCount}자씩 학습하면
            </p>
            <p className="text-lg font-bold text-indigo-700">
              약 {estimation.daysRemaining}일 후 완료 예상
            </p>
            <p className="text-xs text-gray-500">
              ({estimation.estimatedDate})
            </p>
          </div>
        )}
      </main>

      {/* 학습 세션 모달 */}
      {showSession && session && (
        <LearningSessionModal
          session={session}
          sessionType={sessionType}
          kanjiData={kanjiData}
          onClose={handleSessionClose}
        />
      )}

      {/* 설정 모달 */}
      {showSettings && plan && (
        <SettingsModal
          plan={plan}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
