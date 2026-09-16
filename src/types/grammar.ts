// 문법 데이터 타입 정의

export type JlptGrammarLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type GrammarCategory =
  | "기본문형"
  | "부정"
  | "존재"
  | "동사"
  | "이동"
  | "희망"
  | "의뢰"
  | "진행/상태"
  | "과거"
  | "이유"
  | "조건"
  | "추측"
  | "가능"
  | "수동"
  | "사역"
  | "경어";

export type PracticeType = "fill_blank" | "translate" | "convert" | "choice";

export interface GrammarExample {
  ja: string;
  reading: string;
  ko: string;
  audio: string | null;
}

export interface GrammarPractice {
  type: PracticeType;
  question: string;
  options?: string[];
  answer: string;
  acceptableAnswers?: string[];
  explanation?: string;
}

export interface GrammarConjugation {
  [key: string]: {
    form: string;
    meaning: string;
  };
}

export interface GrammarExplanation {
  summary: string;
  detail: string;
  koreanComparison: string;
  commonMistakes: string[];
}

export interface Grammar {
  id: string;
  pattern: string;
  patternReading: string;
  meaning: string;
  jlpt: JlptGrammarLevel;
  category: GrammarCategory;
  order: number;
  explanation: GrammarExplanation;
  conjugation: GrammarConjugation;
  examples: GrammarExample[];
  practice: GrammarPractice[];
  relatedGrammar: string[];
  relatedKanji: string[];
  tags: string[];
}

export interface GrammarData {
  version: string;
  level: JlptGrammarLevel;
  totalCount: number;
  grammar: Grammar[];
}

// 학습 진도 추적용
export interface GrammarProgress {
  grammarId: string;
  learned: boolean;
  masteryLevel: number; // 0-5 (SM-2 알고리즘)
  lastReviewDate: string | null;
  nextReviewDate: string | null;
  correctCount: number;
  incorrectCount: number;
}

// 필터 상태
export interface GrammarFilter {
  level: JlptGrammarLevel | "all";
  category: GrammarCategory | "all";
  searchQuery: string;
  showLearned: boolean;
}
