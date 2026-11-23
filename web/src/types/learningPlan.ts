// 한자 학습실 타입 정의

export interface LearningPlan {
  targetKanji: number;        // 목표 한자 수 (예: 2000)
  dailyNewCount: number;      // 하루 신규 학습 수 (예: 5)
  dailyReviewCount: number;   // 하루 복습 수 (예: 10)
  startDate: string;          // 학습 시작일
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'all';  // 학습 대상 JLPT 레벨
}

export interface DailySession {
  date: string;               // YYYY-MM-DD
  newKanji: string[];         // 오늘 배울 신규 한자
  reviewKanji: string[];      // 오늘 복습할 한자
  completedNew: string[];     // 완료한 신규 한자
  completedReview: string[];  // 완료한 복습 한자
}

export interface KanjiProgress {
  kanji: string;
  stage: LearningStage;
  lastStudied: string | null;
  nextReview: string | null;
  correctCount: number;
  wrongCount: number;
  easeFactor: number;
  interval: number;           // 다음 복습까지 일수
}

export type LearningStage =
  | 'new'           // 아직 안 배움
  | 'learning'      // 학습 중 (첫 복습 전)
  | 'reviewing'     // 복습 중
  | 'mastered';     // 암기 완료 (interval >= 21)

export interface LearningStats {
  totalLearned: number;       // 총 학습한 한자 수
  totalMastered: number;      // 암기 완료 한자 수
  currentStreak: number;      // 연속 학습일
  longestStreak: number;      // 최장 연속 학습일
  todayNew: number;           // 오늘 신규 학습
  todayReview: number;        // 오늘 복습
  accuracy: number;           // 정답률 (0-100)
  lastStudyDate: string | null;
}

export interface LearningStep {
  step: number;
  title: string;
  type: 'meaning' | 'reading' | 'words' | 'quiz' | 'writing' | 'complete';
}

export const LEARNING_STEPS: LearningStep[] = [
  { step: 1, title: '모양 & 뜻', type: 'meaning' },
  { step: 2, title: '음독 & 훈독', type: 'reading' },
  { step: 3, title: '단어 예시', type: 'words' },
  { step: 4, title: '읽기 테스트', type: 'quiz' },
  { step: 5, title: '쓰기 연습', type: 'writing' },
  { step: 6, title: '완료', type: 'complete' },
];

export interface WeeklyStudyData {
  date: string;
  newCount: number;
  reviewCount: number;
}
