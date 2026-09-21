// 복습 서비스 - SM-2 알고리즘 기반 간격 반복 학습

import {
  ReviewProgress,
  ReviewStats,
  ReviewData,
  ReviewItemType,
  ReviewDifficulty,
  WeeklyData,
} from "@/types/review";

const STORAGE_KEY = "nihongo_review_data";
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

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
    version: "1.0.0",
  };
}

// 로컬 스토리지에서 복습 데이터 로드
export function loadReviewData(): ReviewData {
  if (typeof window === "undefined") return getDefaultReviewData();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return getDefaultReviewData();
    return JSON.parse(stored);
  } catch {
    return getDefaultReviewData();
  }
}

// 로컬 스토리지에 복습 데이터 저장
export function saveReviewData(data: ReviewData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 오늘 날짜 문자열 (YYYY-MM-DD)
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
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

  // 새 아이템은 오늘 복습 대상으로 설정
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

  // 난이도에 따른 처리
  switch (difficulty) {
    case "again":
      // 틀림 - 처음부터 다시
      repetitions = 0;
      interval = 0; // 바로 다시
      wrongCount += 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
      break;

    case "hard":
      // 어려움 - 간격 약간 증가
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
      // 적당함 - 표준 SM-2
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
      // 쉬움 - 간격 크게 증가
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

  // 다음 복습 날짜 계산
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
export function saveReviewResult(
  data: ReviewData,
  id: string,
  type: ReviewItemType,
  difficulty: ReviewDifficulty
): ReviewData {
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
    // 연속 유지 또는 오늘 처음
    if (data.stats.lastStudyDate !== today) {
      newData.stats.streak = data.stats.streak + 1;
    }
  } else if (data.stats.lastStudyDate !== today) {
    // 연속 끊김
    newData.stats.streak = 1;
  }

  // 마스터 수 계산 (21일 이상 간격)
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
    // 최근 7일만 유지
    if (newData.weeklyData.length > 7) {
      newData.weeklyData = newData.weeklyData.slice(-7);
    }
  }

  saveReviewData(newData);
  return newData;
}

// 오늘 복습할 아이템 개수
export function getDueCount(
  data: ReviewData,
  type?: ReviewItemType
): number {
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

// 아이템을 복습 목록에 추가 (학습 시작)
export function addItemToReview(
  data: ReviewData,
  id: string,
  type: ReviewItemType
): ReviewData {
  const key = `${type}:${id}`;
  if (data.progress[key]) return data; // 이미 존재

  const newProgress = getProgress(data, id, type);
  const newData = {
    ...data,
    progress: { ...data.progress, [key]: newProgress },
  };

  saveReviewData(newData);
  return newData;
}

// 여러 아이템을 복습 목록에 추가
export function addItemsToReview(
  data: ReviewData,
  items: { id: string; type: ReviewItemType }[]
): ReviewData {
  let newData = { ...data, progress: { ...data.progress } };

  for (const item of items) {
    const key = `${item.type}:${item.id}`;
    if (!newData.progress[key]) {
      newData.progress[key] = getProgress(data, item.id, item.type);
    }
  }

  saveReviewData(newData);
  return newData;
}

// 통계 업데이트 (페이지 로드 시)
export function refreshStats(data: ReviewData): ReviewData {
  const newData = { ...data, stats: { ...data.stats } };
  newData.stats.todayDue = getDueCount(newData);

  // 오늘 날짜 확인 - 날짜가 바뀌면 todayCompleted 리셋
  const today = getTodayString();
  const lastDate = data.stats.lastStudyDate;
  if (lastDate && lastDate !== today) {
    newData.stats.todayCompleted = 0;
  }

  saveReviewData(newData);
  return newData;
}

// 주간 데이터 가져오기 (최근 7일)
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
