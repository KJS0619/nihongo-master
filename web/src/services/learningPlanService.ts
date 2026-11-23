// 한자 학습실 서비스
// localStorage 기반 학습 계획 및 진도 관리

import {
  LearningPlan,
  DailySession,
  KanjiProgress,
  LearningStats,
  LearningStage,
  WeeklyStudyData,
} from "@/types/learningPlan";

const PLAN_KEY = "kanji_learning_plan";
const PROGRESS_KEY = "kanji_learning_progress";
const SESSION_KEY = "kanji_daily_session";
const STATS_KEY = "kanji_learning_stats";

// ==================== 기본값 ====================

function getDefaultPlan(): LearningPlan {
  return {
    targetKanji: 2000,
    dailyNewCount: 5,
    dailyReviewCount: 10,
    startDate: getTodayString(),
    jlptLevel: "all",
  };
}

function getDefaultStats(): LearningStats {
  return {
    totalLearned: 0,
    totalMastered: 0,
    currentStreak: 0,
    longestStreak: 0,
    todayNew: 0,
    todayReview: 0,
    accuracy: 0,
    lastStudyDate: null,
  };
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ==================== 학습 계획 ====================

export function loadPlan(): LearningPlan {
  if (typeof window === "undefined") return getDefaultPlan();
  try {
    const stored = localStorage.getItem(PLAN_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load plan:", e);
  }
  return getDefaultPlan();
}

export function savePlan(plan: LearningPlan): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

// ==================== 진도 관리 ====================

export function loadProgress(): Record<string, KanjiProgress> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
  return {};
}

export function saveProgress(progress: Record<string, KanjiProgress>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function getKanjiProgress(kanji: string): KanjiProgress {
  const progress = loadProgress();
  if (progress[kanji]) return progress[kanji];

  return {
    kanji,
    stage: "new",
    lastStudied: null,
    nextReview: null,
    correctCount: 0,
    wrongCount: 0,
    easeFactor: 2.5,
    interval: 0,
  };
}

export function updateKanjiProgress(
  kanji: string,
  isCorrect: boolean,
  isNew: boolean
): KanjiProgress {
  const progress = loadProgress();
  const current = progress[kanji] || getKanjiProgress(kanji);
  const today = getTodayString();

  let { easeFactor, interval, correctCount, wrongCount } = current;

  if (isCorrect) {
    correctCount += 1;
    if (isNew || interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.ceil(interval * easeFactor);
    }
    easeFactor = Math.min(3.0, easeFactor + 0.1);
  } else {
    wrongCount += 1;
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  const stage: LearningStage =
    interval >= 21 ? "mastered" : interval > 0 ? "reviewing" : "learning";

  const updated: KanjiProgress = {
    kanji,
    stage,
    lastStudied: today,
    nextReview: nextDate.toISOString().split("T")[0],
    correctCount,
    wrongCount,
    easeFactor,
    interval,
  };

  progress[kanji] = updated;
  saveProgress(progress);

  return updated;
}

// ==================== 일일 세션 ====================

export function loadDailySession(): DailySession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const session: DailySession = JSON.parse(stored);
      // 오늘 날짜가 아니면 null 반환
      if (session.date !== getTodayString()) return null;
      return session;
    }
  } catch (e) {
    console.error("Failed to load session:", e);
  }
  return null;
}

export function saveDailySession(session: DailySession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function createDailySession(
  allKanji: string[],
  plan: LearningPlan
): DailySession {
  const today = getTodayString();
  const progress = loadProgress();

  // 복습할 한자: nextReview <= 오늘
  const reviewCandidates = Object.values(progress)
    .filter((p) => p.nextReview && p.nextReview <= today && p.stage !== "new")
    .sort((a, b) => (a.nextReview || "").localeCompare(b.nextReview || ""))
    .map((p) => p.kanji);

  // 신규 한자: 아직 progress에 없거나 stage가 new인 것
  const learnedSet = new Set(
    Object.values(progress)
      .filter((p) => p.stage !== "new")
      .map((p) => p.kanji)
  );
  const newCandidates = allKanji.filter((k) => !learnedSet.has(k));

  // JLPT 필터 적용은 page에서 처리됨

  const session: DailySession = {
    date: today,
    newKanji: newCandidates.slice(0, plan.dailyNewCount),
    reviewKanji: reviewCandidates.slice(0, plan.dailyReviewCount),
    completedNew: [],
    completedReview: [],
  };

  saveDailySession(session);
  return session;
}

export function markKanjiCompleted(
  kanji: string,
  isNew: boolean,
  isCorrect: boolean
): DailySession | null {
  const session = loadDailySession();
  if (!session) return null;

  // 진도 업데이트
  updateKanjiProgress(kanji, isCorrect, isNew);

  // 세션 업데이트
  if (isNew && !session.completedNew.includes(kanji)) {
    session.completedNew.push(kanji);
  } else if (!isNew && !session.completedReview.includes(kanji)) {
    session.completedReview.push(kanji);
  }

  saveDailySession(session);
  updateStats(isNew);

  return session;
}

// ==================== 통계 ====================

export function loadStats(): LearningStats {
  if (typeof window === "undefined") return getDefaultStats();
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load stats:", e);
  }
  return getDefaultStats();
}

export function saveStats(stats: LearningStats): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function updateStats(isNew: boolean): void {
  const stats = loadStats();
  const today = getTodayString();
  const progress = loadProgress();

  // 오늘 학습 수 업데이트
  if (stats.lastStudyDate !== today) {
    // 새로운 날
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (stats.lastStudyDate === yesterdayStr) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }

    stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    stats.todayNew = 0;
    stats.todayReview = 0;
    stats.lastStudyDate = today;
  }

  if (isNew) {
    stats.todayNew += 1;
  } else {
    stats.todayReview += 1;
  }

  // 전체 통계 계산
  const allProgress = Object.values(progress);
  stats.totalLearned = allProgress.filter((p) => p.stage !== "new").length;
  stats.totalMastered = allProgress.filter((p) => p.stage === "mastered").length;

  const totalCorrect = allProgress.reduce((sum, p) => sum + p.correctCount, 0);
  const totalWrong = allProgress.reduce((sum, p) => sum + p.wrongCount, 0);
  const total = totalCorrect + totalWrong;
  stats.accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  saveStats(stats);
}

export function refreshStats(): LearningStats {
  const stats = loadStats();
  const progress = loadProgress();
  const today = getTodayString();

  // 오늘 날짜 확인
  if (stats.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // 어제 학습 안 했으면 streak 초기화
    if (stats.lastStudyDate !== yesterdayStr && stats.lastStudyDate !== today) {
      stats.currentStreak = 0;
    }

    stats.todayNew = 0;
    stats.todayReview = 0;
  }

  // 전체 통계 재계산
  const allProgress = Object.values(progress);
  stats.totalLearned = allProgress.filter((p) => p.stage !== "new").length;
  stats.totalMastered = allProgress.filter((p) => p.stage === "mastered").length;

  const totalCorrect = allProgress.reduce((sum, p) => sum + p.correctCount, 0);
  const totalWrong = allProgress.reduce((sum, p) => sum + p.wrongCount, 0);
  const total = totalCorrect + totalWrong;
  stats.accuracy = total > 0 ? Math.round((totalCorrect / total) * 100) : 0;

  saveStats(stats);
  return stats;
}

// ==================== 예상 완료일 계산 ====================

export function calculateEstimatedCompletion(
  plan: LearningPlan,
  stats: LearningStats
): { daysRemaining: number; estimatedDate: string } {
  const remaining = plan.targetKanji - stats.totalLearned;
  const daysRemaining = Math.ceil(remaining / plan.dailyNewCount);

  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);

  return {
    daysRemaining,
    estimatedDate: estimatedDate.toISOString().split("T")[0],
  };
}

// ==================== 복습 필요 한자 수 ====================

export function getDueReviewCount(): number {
  const today = getTodayString();
  const progress = loadProgress();

  return Object.values(progress).filter(
    (p) => p.nextReview && p.nextReview <= today && p.stage !== "new"
  ).length;
}

// ==================== 주간 데이터 ====================

const WEEKLY_KEY = "kanji_weekly_data";

export function loadWeeklyData(): WeeklyStudyData[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WEEKLY_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load weekly data:", e);
  }
  return [];
}

export function saveWeeklyData(data: WeeklyStudyData[]): void {
  if (typeof window === "undefined") return;
  // 최근 30일만 유지
  const recent = data.slice(-30);
  localStorage.setItem(WEEKLY_KEY, JSON.stringify(recent));
}

export function recordDailyStudy(newCount: number, reviewCount: number): void {
  const today = getTodayString();
  const data = loadWeeklyData();

  const todayIndex = data.findIndex((d) => d.date === today);
  if (todayIndex >= 0) {
    data[todayIndex].newCount += newCount;
    data[todayIndex].reviewCount += reviewCount;
  } else {
    data.push({ date: today, newCount, reviewCount });
  }

  saveWeeklyData(data);
}

export function getWeeklyStats(): WeeklyStudyData[] {
  const data = loadWeeklyData();
  const result: WeeklyStudyData[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const existing = data.find((d) => d.date === dateStr);
    result.push(existing || { date: dateStr, newCount: 0, reviewCount: 0 });
  }

  return result;
}
