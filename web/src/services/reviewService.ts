// 복습 서비스 - SM-2 알고리즘 기반 간격 반복 학습
// Supabase 연동 + localStorage 폴백

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  ReviewProgress,
  ReviewStats,
  ReviewData,
  ReviewItemType,
  ReviewDifficulty,
  WeeklyData,
} from "@/types/review";

const STORAGE_KEY = "nihongo_review_data";
const USER_ID_KEY = "nihongo_user_id";
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

// 사용자 ID 가져오기 (익명 사용자용 UUID 생성)
function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";

  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// 기본 복습 데이터
function getDefaultReviewData(): ReviewData {
  return {
    progress: {},
    stats: {
      todayDue: 0,
      todayCompleted: 0,
      streak: 0,
      totalMastered: 0,
      accuracy: 0,
      lastStudyDate: null,
    },
    weeklyData: [],
    version: "2.0.0",
  };
}

// ==================== localStorage 함수 (폴백용) ====================

function loadFromLocalStorage(): ReviewData {
  if (typeof window === "undefined") return getDefaultReviewData();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultReviewData();
    return JSON.parse(stored);
  } catch {
    return getDefaultReviewData();
  }
}

function saveToLocalStorage(data: ReviewData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ==================== Supabase 함수 ====================

// Supabase에서 복습 데이터 로드
async function loadFromSupabase(): Promise<ReviewData> {
  if (!supabase) return getDefaultReviewData();

  const userId = getUserId();
  const data = getDefaultReviewData();

  try {
    // 1. 복습 진도 로드
    const { data: progressData, error: progressError } = await supabase
      .from("review_progress")
      .select("*")
      .eq("user_id", userId);

    if (progressError) throw progressError;

    if (progressData) {
      for (const row of progressData) {
        const key = `${row.item_type}:${row.item_id}`;
        data.progress[key] = {
          id: row.item_id,
          type: row.item_type as ReviewItemType,
          easeFactor: parseFloat(row.ease_factor),
          interval: row.interval,
          repetitions: row.repetitions,
          nextReviewDate: row.next_review_date,
          lastReviewDate: row.last_review_date,
          totalReviews: row.total_reviews,
          correctCount: row.correct_count,
          wrongCount: row.wrong_count,
        };
      }
    }

    // 2. 통계 로드
    const { data: statsData, error: statsError } = await supabase
      .from("review_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (statsData && !statsError) {
      data.stats = {
        todayDue: statsData.today_due,
        todayCompleted: statsData.today_completed,
        streak: statsData.streak,
        totalMastered: statsData.total_mastered,
        accuracy: statsData.accuracy,
        lastStudyDate: statsData.last_study_date,
      };
    }

    // 3. 주간 데이터 로드
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: weeklyData, error: weeklyError } = await supabase
      .from("review_weekly")
      .select("*")
      .eq("user_id", userId)
      .gte("study_date", sevenDaysAgo.toISOString().split("T")[0])
      .order("study_date", { ascending: true });

    if (weeklyData && !weeklyError) {
      data.weeklyData = weeklyData.map(row => ({
        date: row.study_date,
        count: row.count,
      }));
    }

    // localStorage에도 캐시
    saveToLocalStorage(data);
    return data;

  } catch (error) {
    console.error("Supabase 로드 실패, localStorage 사용:", error);
    return loadFromLocalStorage();
  }
}

// Supabase에 복습 진도 저장
async function saveProgressToSupabase(progress: ReviewProgress): Promise<void> {
  if (!supabase) return;

  const userId = getUserId();

  try {
    await supabase
      .from("review_progress")
      .upsert({
        user_id: userId,
        item_id: progress.id,
        item_type: progress.type,
        ease_factor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        next_review_date: progress.nextReviewDate,
        last_review_date: progress.lastReviewDate,
        total_reviews: progress.totalReviews,
        correct_count: progress.correctCount,
        wrong_count: progress.wrongCount,
      }, {
        onConflict: "user_id,item_id,item_type",
      });
  } catch (error) {
    console.error("진도 저장 실패:", error);
  }
}

// Supabase에 통계 저장
async function saveStatsToSupabase(stats: ReviewStats): Promise<void> {
  if (!supabase) return;

  const userId = getUserId();

  try {
    await supabase
      .from("review_stats")
      .upsert({
        user_id: userId,
        today_due: stats.todayDue,
        today_completed: stats.todayCompleted,
        streak: stats.streak,
        total_mastered: stats.totalMastered,
        accuracy: stats.accuracy,
        last_study_date: stats.lastStudyDate,
      }, {
        onConflict: "user_id",
      });
  } catch (error) {
    console.error("통계 저장 실패:", error);
  }
}

// Supabase에 주간 데이터 저장
async function saveWeeklyToSupabase(date: string, count: number): Promise<void> {
  if (!supabase) return;

  const userId = getUserId();

  try {
    await supabase
      .from("review_weekly")
      .upsert({
        user_id: userId,
        study_date: date,
        count: count,
      }, {
        onConflict: "user_id,study_date",
      });
  } catch (error) {
    console.error("주간 데이터 저장 실패:", error);
  }
}

// ==================== 공통 함수 ====================

// 복습 데이터 로드 (Supabase 우선, localStorage 폴백)
export async function loadReviewData(): Promise<ReviewData> {
  if (isSupabaseConfigured()) {
    return await loadFromSupabase();
  }
  return loadFromLocalStorage();
}

// 동기 버전 (초기 렌더링용 - localStorage만 사용)
export function loadReviewDataSync(): ReviewData {
  return loadFromLocalStorage();
}

// 복습 데이터 저장
export async function saveReviewData(data: ReviewData): Promise<void> {
  // 항상 localStorage에 저장 (캐시)
  saveToLocalStorage(data);

  // Supabase에도 저장 (비동기)
  if (isSupabaseConfigured()) {
    await saveStatsToSupabase(data.stats);
  }
}

// 아이템의 복습 진도 가져오기 (없으면 새로 생성)
export function getProgress(
  data: ReviewData,
  id: string,
  type: ReviewItemType
): ReviewProgress {
  const key = `${type}:${id}`;
  if (data.progress[key]) {
    return data.progress[key];
  }

  return {
    id,
    type,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: getTodayString(),
    lastReviewDate: null,
    totalReviews: 0,
    correctCount: 0,
    wrongCount: 0,
  };
}

// SM-2 알고리즘으로 다음 복습 계산
export function calculateNextReview(
  progress: ReviewProgress,
  difficulty: ReviewDifficulty
): ReviewProgress {
  const today = getTodayString();
  let { easeFactor, interval, repetitions, correctCount, wrongCount, totalReviews } = progress;

  totalReviews += 1;

  switch (difficulty) {
    case "again":
      repetitions = 0;
      interval = 0;
      wrongCount += 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;

    case "hard":
      correctCount += 1;
      if (repetitions === 0) {
        interval = 1;
      } else {
        interval = Math.ceil(interval * 1.2);
      }
      repetitions += 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      break;

    case "good":
      correctCount += 1;
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.ceil(interval * easeFactor);
      }
      repetitions += 1;
      break;

    case "easy":
      correctCount += 1;
      if (repetitions === 0) {
        interval = 4;
      } else {
        interval = Math.ceil(interval * easeFactor * 1.3);
      }
      repetitions += 1;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      break;
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  return {
    ...progress,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextDate.toISOString().split("T")[0],
    lastReviewDate: today,
    totalReviews,
    correctCount,
    wrongCount,
  };
}

// 복습 결과 저장
export async function saveReviewResult(
  data: ReviewData,
  id: string,
  type: ReviewItemType,
  difficulty: ReviewDifficulty
): Promise<ReviewData> {
  const key = `${type}:${id}`;
  const currentProgress = getProgress(data, id, type);
  const updatedProgress = calculateNextReview(currentProgress, difficulty);

  const newData = { ...data };
  newData.progress = { ...data.progress, [key]: updatedProgress };

  // 통계 업데이트
  const today = getTodayString();
  newData.stats = { ...data.stats };
  newData.stats.todayCompleted += 1;
  newData.stats.lastStudyDate = today;

  // 연속 학습일 계산
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (data.stats.lastStudyDate === yesterdayStr || data.stats.lastStudyDate === today) {
    if (data.stats.lastStudyDate !== today) {
      newData.stats.streak = data.stats.streak + 1;
    }
  } else if (data.stats.lastStudyDate !== today) {
    newData.stats.streak = 1;
  }

  // 마스터 수 계산
  newData.stats.totalMastered = Object.values(newData.progress).filter(
    p => p.interval >= 21
  ).length;

  // 정답률 계산
  const allProgress = Object.values(newData.progress);
  const totalCorrect = allProgress.reduce((sum, p) => sum + p.correctCount, 0);
  const totalReviews = allProgress.reduce((sum, p) => sum + p.totalReviews, 0);
  newData.stats.accuracy = totalReviews > 0
    ? Math.round((totalCorrect / totalReviews) * 100)
    : 0;

  // 주간 데이터 업데이트
  const weeklyIndex = newData.weeklyData.findIndex(w => w.date === today);
  if (weeklyIndex >= 0) {
    newData.weeklyData[weeklyIndex].count += 1;
  } else {
    newData.weeklyData.push({ date: today, count: 1 });
    if (newData.weeklyData.length > 7) {
      newData.weeklyData = newData.weeklyData.slice(-7);
    }
  }

  // 저장
  saveToLocalStorage(newData);

  // Supabase에 비동기 저장
  if (isSupabaseConfigured()) {
    saveProgressToSupabase(updatedProgress);
    saveStatsToSupabase(newData.stats);
    const weeklyEntry = newData.weeklyData.find(w => w.date === today);
    if (weeklyEntry) {
      saveWeeklyToSupabase(today, weeklyEntry.count);
    }
  }

  return newData;
}

// 오늘 복습할 아이템 개수
export function getDueCount(data: ReviewData, type?: ReviewItemType): number {
  const today = getTodayString();
  return Object.values(data.progress).filter(p => {
    if (type && p.type !== type) return false;
    return p.nextReviewDate <= today;
  }).length;
}

// 오늘 복습할 아이템 ID 목록
export function getDueItems(
  data: ReviewData,
  type?: ReviewItemType
): { id: string; type: ReviewItemType }[] {
  const today = getTodayString();
  return Object.values(data.progress)
    .filter(p => {
      if (type && p.type !== type) return false;
      return p.nextReviewDate <= today;
    })
    .map(p => ({ id: p.id, type: p.type }));
}

// 아이템을 복습 목록에 추가
export async function addItemToReview(
  data: ReviewData,
  id: string,
  type: ReviewItemType
): Promise<ReviewData> {
  const key = `${type}:${id}`;
  if (data.progress[key]) return data;

  const newProgress = getProgress(data, id, type);
  const newData = {
    ...data,
    progress: { ...data.progress, [key]: newProgress },
  };

  saveToLocalStorage(newData);

  if (isSupabaseConfigured()) {
    saveProgressToSupabase(newProgress);
  }

  return newData;
}

// 여러 아이템을 복습 목록에 추가
export async function addItemsToReview(
  data: ReviewData,
  items: { id: string; type: ReviewItemType }[]
): Promise<ReviewData> {
  let newData = { ...data, progress: { ...data.progress } };
  const newItems: ReviewProgress[] = [];

  for (const item of items) {
    const key = `${item.type}:${item.id}`;
    if (!newData.progress[key]) {
      const progress = getProgress(data, item.id, item.type);
      newData.progress[key] = progress;
      newItems.push(progress);
    }
  }

  saveToLocalStorage(newData);

  // Supabase에 배치 저장
  if (isSupabaseConfigured() && newItems.length > 0) {
    for (const progress of newItems) {
      saveProgressToSupabase(progress);
    }
  }

  return newData;
}

// 통계 업데이트 (페이지 로드 시)
export async function refreshStats(data: ReviewData): Promise<ReviewData> {
  const newData = { ...data, stats: { ...data.stats } };
  newData.stats.todayDue = getDueCount(newData);

  const today = getTodayString();
  const lastDate = data.stats.lastStudyDate;
  if (lastDate && lastDate !== today) {
    newData.stats.todayCompleted = 0;
  }

  saveToLocalStorage(newData);

  if (isSupabaseConfigured()) {
    saveStatsToSupabase(newData.stats);
  }

  return newData;
}

// 주간 데이터 가져오기
export function getWeeklyData(data: ReviewData): WeeklyData[] {
  const result: WeeklyData[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const existing = data.weeklyData.find(w => w.date === dateStr);
    result.push({
      date: dateStr,
      count: existing?.count || 0,
    });
  }

  return result;
}

// 요일 이름
export function getDayName(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

// localStorage → Supabase 마이그레이션
export async function migrateToSupabase(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log("Supabase가 설정되지 않았습니다.");
    return false;
  }

  const localData = loadFromLocalStorage();
  if (Object.keys(localData.progress).length === 0) {
    console.log("마이그레이션할 로컬 데이터가 없습니다.");
    return true;
  }

  console.log(`마이그레이션 시작: ${Object.keys(localData.progress).length}개 항목`);

  try {
    // 진도 데이터 마이그레이션
    for (const progress of Object.values(localData.progress)) {
      await saveProgressToSupabase(progress);
    }

    // 통계 마이그레이션
    await saveStatsToSupabase(localData.stats);

    // 주간 데이터 마이그레이션
    for (const weekly of localData.weeklyData) {
      await saveWeeklyToSupabase(weekly.date, weekly.count);
    }

    console.log("마이그레이션 완료!");
    return true;
  } catch (error) {
    console.error("마이그레이션 실패:", error);
    return false;
  }
}
