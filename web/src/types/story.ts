// 일본 옛날이야기 학습 타입 정의

export type StoryDifficulty = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface Story {
  id: string;
  title: string;           // 桃太郎
  titleKo: string;         // 모모타로
  titleReading: string;    // ももたろう
  author: string;          // 楠山正雄
  source: string;          // 青空文庫
  sourceUrl?: string;      // 원본 URL
  difficulty: StoryDifficulty;
  estimatedMinutes: number;
  themes: string[];        // ['모험', '동물', '권선징악']
  summary: string;         // 한국어 요약
  summaryJa: string;       // 일본어 요약
  coverImage?: string;     // 커버 이미지 URL
  paragraphs: StoryParagraph[];
  vocabulary: StoryVocabulary[];  // 주요 단어 목록
  grammarPoints: StoryGrammarPoint[];  // 주요 문법 포인트
}

export interface StoryMeta {
  id: string;
  title: string;
  titleKo: string;
  titleReading: string;
  author: string;
  difficulty: StoryDifficulty;
  estimatedMinutes: number;
  themes: string[];
  summary: string;
  coverImage?: string;
  sentenceCount: number;
  vocabularyCount: number;
}

export interface StoryParagraph {
  id: string;
  sentences: StorySentence[];
}

export interface StorySentence {
  id: string;
  text: string;            // 昔々、あるところに
  reading: string;         // むかしむかし、あるところに
  translation: string;     // 옛날 옛날, 어느 곳에
  tokens?: TokenInfo[];    // 형태소 분석 결과 (런타임에 생성 가능)
  grammarNotes?: GrammarNote[];  // 문장 내 문법 포인트
}

export interface TokenInfo {
  surface: string;         // 昔々
  reading: string;         // ムカシムカシ
  pos: string;             // 名詞 (품사)
  posDetail: string;       // 一般 (품사 상세)
  baseForm: string;        // 昔々 (기본형)
  conjugation?: string;    // 활용형 (동사/형용사)
  conjugationType?: string; // 활용 종류
}

export interface GrammarNote {
  pattern: string;         // 〜ていました
  range: [number, number]; // 문장 내 위치 [시작, 끝]
  explanation: string;     // 과거의 지속적인 상태
  jlptLevel: StoryDifficulty;
}

export interface StoryVocabulary {
  word: string;            // 桃
  reading: string;         // もも
  meaning: string;         // 복숭아
  pos: string;             // 名詞
  jlptLevel?: StoryDifficulty;
  sentenceIds: string[];   // 이 단어가 등장하는 문장 ID들
}

export interface StoryGrammarPoint {
  id: string;
  pattern: string;         // 〜ていました
  explanation: string;     // 과거의 지속적인 상태를 나타냅니다
  jlptLevel: StoryDifficulty;
  examples: GrammarExample[];
}

export interface GrammarExample {
  sentence: string;        // 住んでいました
  reading: string;         // すんでいました
  translation: string;     // 살고 있었습니다
}

// 사용자 진행률 관련 타입
export interface StoryProgress {
  storyId: string;
  currentParagraph: number;
  currentSentence: number;
  completedAt?: string;    // ISO date string
  lastReadAt: string;      // ISO date string
  totalReadTime: number;   // 분 단위
}

// AI 설명 요청/응답 타입
export interface ExplainRequest {
  sentence: string;
  question?: string;       // 사용자 질문 (없으면 기본 분석)
  context?: string;        // 이야기 제목 등 컨텍스트
}

export interface ExplainResponse {
  explanation: string;     // 메인 설명
  grammarPoints: {
    pattern: string;
    explanation: string;
    jlptLevel: string;
  }[];
  vocabulary: {
    word: string;
    reading: string;
    meaning: string;
    note?: string;         // 왜 이 단어를 썼는지 등
  }[];
  culturalNote?: string;   // 문화적 배경 설명
  alternativeExpressions?: {
    expression: string;
    meaning: string;
    nuance: string;        // 원문과의 뉘앙스 차이
  }[];
}

// 읽기 설정 타입
export interface ReaderSettings {
  furiganaMode: 'all' | 'n3plus' | 'none';  // 후리가나 표시
  showTranslation: 'always' | 'tap' | 'none';  // 번역 표시
  fontSize: 'small' | 'medium' | 'large';
  ttsSpeed: number;        // 0.5 ~ 1.5
}

// 기본 설정값
export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  furiganaMode: 'all',
  showTranslation: 'tap',
  fontSize: 'medium',
  ttsSpeed: 1.0,
};

// 난이도별 색상
export const DIFFICULTY_COLORS: Record<StoryDifficulty, string> = {
  N5: 'bg-green-500',
  N4: 'bg-blue-500',
  N3: 'bg-yellow-500',
  N2: 'bg-orange-500',
  N1: 'bg-red-500',
};

export const DIFFICULTY_TEXT_COLORS: Record<StoryDifficulty, string> = {
  N5: 'text-green-600 dark:text-green-400',
  N4: 'text-blue-600 dark:text-blue-400',
  N3: 'text-yellow-600 dark:text-yellow-400',
  N2: 'text-orange-600 dark:text-orange-400',
  N1: 'text-red-600 dark:text-red-400',
};
