export type JlptLevel = "N1" | "N2" | "N3" | "N4" | "N5";

export const JLPT_LEVEL_OPTIONS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

export interface CustomWord {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  pos: WordPOS;
  jlpt_level?: JlptLevel | null;
  source?: string;
  memo?: string;
  created_at: string;
}

export type WordPOS =
  | "명사"
  | "동사"
  | "い형용사"
  | "な형용사"
  | "부사"
  | "접속사"
  | "감탄사"
  | "조사"
  | "문법"
  | "기타";

export const POS_OPTIONS: WordPOS[] = [
  "명사",
  "동사",
  "い형용사",
  "な형용사",
  "부사",
  "접속사",
  "감탄사",
  "조사",
  "문법",
  "기타",
];

export interface WordFormData {
  word: string;
  reading: string;
  meaning: string;
  pos: WordPOS;
  jlpt_level?: JlptLevel | null;
  source?: string;
  memo?: string;
}

// ============================================
// JLPT 단어 학습용 타입 정의
// ============================================

export type VerbType = "1그룹" | "2그룹" | "3그룹";
export type AdjectiveType = "い형용사" | "な형용사";

export interface WordExample {
  ja: string;
  reading: string;
  ko: string;
}

export interface WordConjugation {
  form: string;       // 활용형 이름 (예: ます형, て형)
  value: string;      // 활용된 형태
  reading: string;    // 읽기
}

export interface RelatedWord {
  word: string;
  reading: string;
  meaning: string;
  relation: "유의어" | "반의어" | "관련어";
}

export interface JlptWord {
  id: string;
  word: string;           // 단어 (한자 포함)
  reading: string;        // 히라가나 읽기
  meaning: string;        // 한국어 뜻
  meaningDetail?: string; // 상세 의미
  jlpt: JlptLevel;
  category: WordPOS;
  verbType?: VerbType;
  adjectiveType?: AdjectiveType;
  pitch?: number[];       // 피치 악센트 (0: 저, 1: 고)
  examples: WordExample[];
  conjugations?: WordConjugation[];
  relatedWords?: RelatedWord[];
  kanji?: {
    char: string;
    reading: string;
    meaning: string;
  }[];
  tags: string[];
  frequency: number;      // 빈도 순위 (낮을수록 자주 사용)
}

export interface JlptWordData {
  version: string;
  totalCount: number;
  words: JlptWord[];
}

// 학습 진도 추적용
export interface WordProgress {
  wordId: string;
  mastered: boolean;
  correctCount: number;
  incorrectCount: number;
  lastStudyDate: string | null;
}

// 필터 상태
export interface WordFilter {
  level: JlptLevel | "all";
  category: WordPOS | "all";
  searchQuery: string;
}
