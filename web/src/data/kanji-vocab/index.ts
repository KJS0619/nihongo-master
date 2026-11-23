// kanji-vocab 데이터 타입 및 로더
// 원본: https://github.com/KJS0619/kanji-vocab

export interface VocabCard {
  term: string;      // 한자/단어
  reading: string;   // 읽기
  meaning: string;   // 뜻
  mnemonic: string;  // 연상법
}

export interface DayInfo {
  day: number;
  title: string;
  subtitle: string;
  cards: VocabCard[];
}

export interface KanjiGlossaryEntry {
  hunEum: string;    // 훈음 (예: "터 기")
  readings: string;  // 음독/훈독 (예: "き・もと")
  description: string; // 설명
}

// 22일 커리큘럼 메타데이터
export const DAY_INFO: { day: number; title: string; subtitle: string }[] = [
  { day: 1, title: "기초 한자", subtitle: "생활 한자 100자" },
  { day: 2, title: "기초 한자", subtitle: "생활 한자 100자" },
  { day: 3, title: "기초 어휘", subtitle: "일상 단어" },
  { day: 4, title: "기초 어휘", subtitle: "일상 단어" },
  { day: 5, title: "학습 어휘", subtitle: "학습 단어" },
  { day: 6, title: "학습 어휘", subtitle: "학습 단어" },
  { day: 7, title: "명사", subtitle: "사물 명사" },
  { day: 8, title: "명사", subtitle: "사물 명사" },
  { day: 9, title: "명사", subtitle: "추상 명사" },
  { day: 10, title: "명사·동사", subtitle: "명사와 동사" },
  { day: 11, title: "동사", subtitle: "기본 동사" },
  { day: 12, title: "동사", subtitle: "기본 동사" },
  { day: 13, title: "동사", subtitle: "복합 동사" },
  { day: 14, title: "동사·형용사", subtitle: "동사와 형용사" },
  { day: 15, title: "형용사·부사", subtitle: "형용사와 부사" },
  { day: 16, title: "부사·의태어", subtitle: "부사와 의태어" },
  { day: 17, title: "카타카나·부사", subtitle: "외래어와 부사" },
  { day: 18, title: "카타카나", subtitle: "외래어" },
  { day: 19, title: "연결 표현", subtitle: "접속사와 표현" },
  { day: 20, title: "생활 어휘", subtitle: "생활 단어" },
  { day: 21, title: "생활 어휘", subtitle: "생활 단어" },
  { day: 22, title: "경어·수 세기", subtitle: "존경어와 숫자" },
];

// 동적으로 day 데이터 로드
export async function loadDayCards(day: number): Promise<VocabCard[]> {
  const response = await fetch(`/data/kanji-vocab/day${day.toString().padStart(2, '0')}.json`);
  const data = await response.json();
  return data.map((card: string[]) => ({
    term: card[0],
    reading: card[1],
    meaning: card[2],
    mnemonic: card[3] || '',
  }));
}

// 한자 사전 로드
export async function loadKanjiGlossary(): Promise<Record<string, KanjiGlossaryEntry>> {
  const response = await fetch('/data/kanji-vocab/kanji-glossary.json');
  const data = await response.json();
  const glossary: Record<string, KanjiGlossaryEntry> = {};
  for (const [kanji, info] of Object.entries(data)) {
    const [hunEum, readings, description] = info as string[];
    glossary[kanji] = { hunEum, readings, description };
  }
  return glossary;
}
