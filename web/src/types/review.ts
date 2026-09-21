// 복습 시스템 타입 정의

export type ReviewItemType = "word" | "grammar" | "kanji";

export type ReviewDifficulty = "again" | "hard" | "good" | "easy";

// SM-2 알고리즘 기반 간격 반복 데이터
export interface ReviewProgress {
  id: string;                    // 아이템 ID
  type: ReviewItemType;          // 아이템 타입
  easeFactor: number;            // 난이도 계수 (2.5 기본)
  interval: number;              // 현재 간격 (일 단위)
  repetitions: number;           // 연속 정답 횟수
  nextReviewDate: string;        // 다음 복습 날짜 (ISO string)
  lastReviewDate: string | null; // 마지막 복습 날짜
  totalReviews: number;          // 총 복습 횟수
  correctCount: number;          // 정답 횟수
  wrongCount: number;            // 오답 횟수
}

// 오늘의 복습 통계
export interface ReviewStats {
  todayDue: number;              // 오늘 복습할 항목 수
  todayCompleted: number;        // 오늘 완료한 항목 수
  streak: number;                // 연속 학습일
  totalMastered: number;         // 마스터한 항목 수 (interval >= 21일)
  accuracy: number;              // 전체 정답률
  lastStudyDate: string | null;  // 마지막 학습 날짜
}

// 주간 학습 데이터
export interface WeeklyData {
  date: string;
  count: number;
}

// 복습 세션 아이템
export interface ReviewSessionItem {
  id: string;
  type: ReviewItemType;
  front: {
    primary: string;      // 주요 표시 (한자, 단어, 문법패턴)
    secondary?: string;   // 보조 표시 (읽기 등)
  };
  back: {
    primary: string;      // 정답 (뜻)
    secondary?: string;   // 추가 정보
    examples?: string[];  // 예문
  };
  progress?: ReviewProgress;
}

// 복습 세션 결과
export interface ReviewSessionResult {
  itemId: string;
  type: ReviewItemType;
  difficulty: ReviewDifficulty;
  timeSpent: number;      // 밀리초
}

// 저장된 전체 복습 데이터
export interface ReviewData {
  progress: Record<string, ReviewProgress>;  // id -> progress
  stats: ReviewStats;
  weeklyData: WeeklyData[];
  version: string;
}
