// 회화 데이터 타입 정의

export type JlptConversationLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export type ConversationCategory =
  | "인사"
  | "쇼핑"
  | "식당"
  | "길찾기"
  | "전화"
  | "사과/감사"
  | "일상"
  | "비즈니스"
  | "여행"
  | "의료";

export interface DialogueLine {
  id: number;
  speaker: string;
  speakerName: string;
  speakerNameReading: string;
  ja: string;
  reading: string;
  ko: string;
  note?: string;
}

export interface KeyExpression {
  ja: string;
  reading: string;
  ko: string;
  usage: string;
  formality: "매우 정중" | "정중" | "보통" | "반말";
}

export interface ConversationVocabulary {
  word: string;
  reading: string;
  meaning: string;
}

export interface RolePlayPractice {
  yourRole: string;
  situation: string;
}

export interface ConversationPractice {
  rolePlay: RolePlayPractice;
  shadowing: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  titleJa: string;
  situation: string;
  description: string;
  jlpt: JlptConversationLevel;
  category: ConversationCategory;
  difficulty: number; // 1-5
  estimatedTime: number; // minutes
  thumbnail: string;
  dialogue: DialogueLine[];
  keyExpressions: KeyExpression[];
  vocabulary: ConversationVocabulary[];
  culturalNote: string;
  relatedGrammar: string[];
  practice: ConversationPractice;
}

export interface ConversationData {
  version: string;
  totalCount: number;
  conversations: Conversation[];
}

// 학습 진도 추적용
export interface ConversationProgress {
  conversationId: string;
  completed: boolean;
  shadowingCount: number;
  rolePlayCount: number;
  lastStudyDate: string | null;
}

// 필터 상태
export interface ConversationFilter {
  level: JlptConversationLevel | "all";
  category: ConversationCategory | "all";
  searchQuery: string;
}
