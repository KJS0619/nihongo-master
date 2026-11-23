"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { Kanji, JLPT_COLORS } from "@/types/kanji";
import clsx from "clsx";

// JLPT 단어 타입
export interface JlptWordSimple {
  word: string;
  reading: string;
  meaning: string;
  jlpt: string;
}

// 강희자전 214 부수 매핑 (번호 → 부수 문자)
const RADICAL_MAP: Record<number, { char: string; name: string }> = {
  1: { char: "一", name: "한 일" },
  2: { char: "丨", name: "뚫을 곤" },
  3: { char: "丶", name: "점 주" },
  4: { char: "丿", name: "삐침 별" },
  5: { char: "乙", name: "새 을" },
  6: { char: "亅", name: "갈고리 궐" },
  7: { char: "二", name: "두 이" },
  8: { char: "亠", name: "돼지해머리" },
  9: { char: "人", name: "사람 인" },
  10: { char: "儿", name: "어진사람" },
  11: { char: "入", name: "들 입" },
  12: { char: "八", name: "여덟 팔" },
  13: { char: "冂", name: "멀 경" },
  14: { char: "冖", name: "덮을 멱" },
  15: { char: "冫", name: "얼음 빙" },
  16: { char: "几", name: "안석 궤" },
  17: { char: "凵", name: "받침 감" },
  18: { char: "刀", name: "칼 도" },
  19: { char: "力", name: "힘 력" },
  20: { char: "勹", name: "쌀 포" },
  21: { char: "匕", name: "비수 비" },
  22: { char: "匚", name: "상자 방" },
  23: { char: "匸", name: "감출 혜" },
  24: { char: "十", name: "열 십" },
  25: { char: "卜", name: "점 복" },
  26: { char: "卩", name: "병부 절" },
  27: { char: "厂", name: "언덕 한" },
  28: { char: "厶", name: "사사 사" },
  29: { char: "又", name: "또 우" },
  30: { char: "口", name: "입 구" },
  31: { char: "囗", name: "에울 위" },
  32: { char: "土", name: "흙 토" },
  33: { char: "士", name: "선비 사" },
  34: { char: "夂", name: "뒤져올 치" },
  35: { char: "夊", name: "천천히걸을 쇠" },
  36: { char: "夕", name: "저녁 석" },
  37: { char: "大", name: "큰 대" },
  38: { char: "女", name: "계집 녀" },
  39: { char: "子", name: "아들 자" },
  40: { char: "宀", name: "집 면" },
  41: { char: "寸", name: "마디 촌" },
  42: { char: "小", name: "작을 소" },
  43: { char: "尢", name: "절름발이 왕" },
  44: { char: "尸", name: "주검 시" },
  45: { char: "屮", name: "싹 철" },
  46: { char: "山", name: "메 산" },
  47: { char: "巛", name: "내 천" },
  48: { char: "工", name: "장인 공" },
  49: { char: "己", name: "몸 기" },
  50: { char: "巾", name: "수건 건" },
  51: { char: "干", name: "방패 간" },
  52: { char: "幺", name: "작을 요" },
  53: { char: "广", name: "집 엄" },
  54: { char: "廴", name: "끌 인" },
  55: { char: "廾", name: "두손 공" },
  56: { char: "弋", name: "주살 익" },
  57: { char: "弓", name: "활 궁" },
  58: { char: "彐", name: "돼지머리 계" },
  59: { char: "彡", name: "터럭 삼" },
  60: { char: "彳", name: "조금걸을 척" },
  61: { char: "心", name: "마음 심" },
  62: { char: "戈", name: "창 과" },
  63: { char: "戶", name: "지게 호" },
  64: { char: "手", name: "손 수" },
  65: { char: "支", name: "지탱할 지" },
  66: { char: "攴", name: "칠 복" },
  67: { char: "文", name: "글월 문" },
  68: { char: "斗", name: "말 두" },
  69: { char: "斤", name: "도끼 근" },
  70: { char: "方", name: "모 방" },
  71: { char: "无", name: "없을 무" },
  72: { char: "日", name: "날 일" },
  73: { char: "曰", name: "가로 왈" },
  74: { char: "月", name: "달 월" },
  75: { char: "木", name: "나무 목" },
  76: { char: "欠", name: "하품 흠" },
  77: { char: "止", name: "그칠 지" },
  78: { char: "歹", name: "부서질뼈 알" },
  79: { char: "殳", name: "몽둥이 수" },
  80: { char: "毋", name: "말 무" },
  81: { char: "比", name: "견줄 비" },
  82: { char: "毛", name: "터럭 모" },
  83: { char: "氏", name: "성씨 씨" },
  84: { char: "气", name: "기운 기" },
  85: { char: "水", name: "물 수" },
  86: { char: "火", name: "불 화" },
  87: { char: "爪", name: "손톱 조" },
  88: { char: "父", name: "아비 부" },
  89: { char: "爻", name: "사귈 효" },
  90: { char: "爿", name: "조각 장" },
  91: { char: "片", name: "조각 편" },
  92: { char: "牙", name: "어금니 아" },
  93: { char: "牛", name: "소 우" },
  94: { char: "犬", name: "개 견" },
  95: { char: "玄", name: "검을 현" },
  96: { char: "玉", name: "구슬 옥" },
  97: { char: "瓜", name: "오이 과" },
  98: { char: "瓦", name: "기와 와" },
  99: { char: "甘", name: "달 감" },
  100: { char: "生", name: "날 생" },
  101: { char: "用", name: "쓸 용" },
  102: { char: "田", name: "밭 전" },
  103: { char: "疋", name: "필 필" },
  104: { char: "疒", name: "병질 녁" },
  105: { char: "癶", name: "필 발" },
  106: { char: "白", name: "흰 백" },
  107: { char: "皮", name: "가죽 피" },
  108: { char: "皿", name: "그릇 명" },
  109: { char: "目", name: "눈 목" },
  110: { char: "矛", name: "창 모" },
  111: { char: "矢", name: "화살 시" },
  112: { char: "石", name: "돌 석" },
  113: { char: "示", name: "보일 시" },
  114: { char: "禸", name: "발없는벌레 유" },
  115: { char: "禾", name: "벼 화" },
  116: { char: "穴", name: "굴 혈" },
  117: { char: "立", name: "설 립" },
  118: { char: "竹", name: "대 죽" },
  119: { char: "米", name: "쌀 미" },
  120: { char: "糸", name: "실 사" },
  121: { char: "缶", name: "장군 부" },
  122: { char: "网", name: "그물 망" },
  123: { char: "羊", name: "양 양" },
  124: { char: "羽", name: "깃 우" },
  125: { char: "老", name: "늙을 로" },
  126: { char: "而", name: "말이을 이" },
  127: { char: "耒", name: "쟁기 뢰" },
  128: { char: "耳", name: "귀 이" },
  129: { char: "聿", name: "붓 율" },
  130: { char: "肉", name: "고기 육" },
  131: { char: "臣", name: "신하 신" },
  132: { char: "自", name: "스스로 자" },
  133: { char: "至", name: "이를 지" },
  134: { char: "臼", name: "절구 구" },
  135: { char: "舌", name: "혀 설" },
  136: { char: "舛", name: "어긋날 천" },
  137: { char: "舟", name: "배 주" },
  138: { char: "艮", name: "그칠 간" },
  139: { char: "色", name: "빛 색" },
  140: { char: "艸", name: "풀 초" },
  141: { char: "虍", name: "범호피무늬" },
  142: { char: "虫", name: "벌레 충" },
  143: { char: "血", name: "피 혈" },
  144: { char: "行", name: "다닐 행" },
  145: { char: "衣", name: "옷 의" },
  146: { char: "襾", name: "덮을 아" },
  147: { char: "見", name: "볼 견" },
  148: { char: "角", name: "뿔 각" },
  149: { char: "言", name: "말씀 언" },
  150: { char: "谷", name: "골 곡" },
  151: { char: "豆", name: "콩 두" },
  152: { char: "豕", name: "돼지 시" },
  153: { char: "豸", name: "벌레 치" },
  154: { char: "貝", name: "조개 패" },
  155: { char: "赤", name: "붉을 적" },
  156: { char: "走", name: "달릴 주" },
  157: { char: "足", name: "발 족" },
  158: { char: "身", name: "몸 신" },
  159: { char: "車", name: "수레 차" },
  160: { char: "辛", name: "매울 신" },
  161: { char: "辰", name: "별 진" },
  162: { char: "辵", name: "갈 착" },
  163: { char: "邑", name: "고을 읍" },
  164: { char: "酉", name: "닭 유" },
  165: { char: "釆", name: "분별할 변" },
  166: { char: "里", name: "마을 리" },
  167: { char: "金", name: "쇠 금" },
  168: { char: "長", name: "길 장" },
  169: { char: "門", name: "문 문" },
  170: { char: "阜", name: "언덕 부" },
  171: { char: "隶", name: "미칠 이" },
  172: { char: "隹", name: "새 추" },
  173: { char: "雨", name: "비 우" },
  174: { char: "靑", name: "푸를 청" },
  175: { char: "非", name: "아닐 비" },
  176: { char: "面", name: "얼굴 면" },
  177: { char: "革", name: "가죽 혁" },
  178: { char: "韋", name: "가죽 위" },
  179: { char: "韭", name: "부추 구" },
  180: { char: "音", name: "소리 음" },
  181: { char: "頁", name: "머리 혈" },
  182: { char: "風", name: "바람 풍" },
  183: { char: "飛", name: "날 비" },
  184: { char: "食", name: "먹을 식" },
  185: { char: "首", name: "머리 수" },
  186: { char: "香", name: "향기 향" },
  187: { char: "馬", name: "말 마" },
  188: { char: "骨", name: "뼈 골" },
  189: { char: "高", name: "높을 고" },
  190: { char: "髟", name: "터럭 표" },
  191: { char: "鬥", name: "싸울 투" },
  192: { char: "鬯", name: "울창주 창" },
  193: { char: "鬲", name: "솥 력" },
  194: { char: "鬼", name: "귀신 귀" },
  195: { char: "魚", name: "물고기 어" },
  196: { char: "鳥", name: "새 조" },
  197: { char: "鹵", name: "소금 로" },
  198: { char: "鹿", name: "사슴 록" },
  199: { char: "麥", name: "보리 맥" },
  200: { char: "麻", name: "삼 마" },
  201: { char: "黃", name: "누를 황" },
  202: { char: "黍", name: "기장 서" },
  203: { char: "黑", name: "검을 흑" },
  204: { char: "黹", name: "바느질 치" },
  205: { char: "黽", name: "맹꽁이 맹" },
  206: { char: "鼎", name: "솥 정" },
  207: { char: "鼓", name: "북 고" },
  208: { char: "鼠", name: "쥐 서" },
  209: { char: "鼻", name: "코 비" },
  210: { char: "齊", name: "가지런할 제" },
  211: { char: "齒", name: "이 치" },
  212: { char: "龍", name: "용 룡" },
  213: { char: "龜", name: "거북 귀" },
  214: { char: "龠", name: "피리 약" },
};

interface RadicalDetailModalProps {
  radicalNumber: number;
  kanjiList: Kanji[]; // 전체 한자 목록
  onClose: () => void;
  onKanjiClick: (kanji: Kanji) => void; // 한자 클릭 시 콜백
  onWordClick?: (word: JlptWordSimple) => void; // 단어 클릭 시 콜백
}

export function RadicalDetailModal({
  radicalNumber,
  kanjiList,
  onClose,
  onKanjiClick,
  onWordClick,
}: RadicalDetailModalProps) {
  const radicalInfo = RADICAL_MAP[radicalNumber];
  const [jlptWords, setJlptWords] = useState<JlptWordSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"kanji" | "words">("kanji");

  // JLPT 단어 데이터 로드
  useEffect(() => {
    async function loadJlptWords() {
      try {
        const response = await fetch("/data/jlpt_words.json");
        const data = await response.json();
        setJlptWords(data.words || []);
      } catch (err) {
        console.error("Failed to load JLPT words:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJlptWords();
  }, []);

  // 해당 부수를 가진 한자 목록
  const relatedKanji = useMemo(() => {
    return kanjiList.filter((k) => k.radical === radicalNumber);
  }, [kanjiList, radicalNumber]);

  // 해당 부수를 가진 한자가 포함된 JLPT 단어
  const relatedWords = useMemo(() => {
    const radicalKanjiSet = new Set(relatedKanji.map((k) => k.literal));
    return jlptWords.filter((word) => {
      // 단어에 포함된 한자 중 해당 부수를 가진 것이 있는지 확인
      for (const char of word.word) {
        if (radicalKanjiSet.has(char)) {
          return true;
        }
      }
      return false;
    });
  }, [jlptWords, relatedKanji]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // 배경 클릭으로 닫기
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // 단어에서 해당 부수 한자 하이라이트
  const highlightKanji = (word: string) => {
    const radicalKanjiSet = new Set(relatedKanji.map((k) => k.literal));
    return word.split("").map((char, idx) => {
      if (radicalKanjiSet.has(char)) {
        return (
          <span
            key={idx}
            className="text-purple-600 dark:text-purple-400 font-bold cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              const kanji = kanjiList.find((k) => k.literal === char);
              if (kanji) onKanjiClick(kanji);
            }}
          >
            {char}
          </span>
        );
      }
      return <span key={idx}>{char}</span>;
    });
  };

  if (!radicalInfo) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          "relative w-full max-w-md mx-4 max-h-[85vh] flex flex-col overflow-hidden",
          "bg-white dark:bg-gray-900 rounded-2xl",
          "shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 뒤로가기 버튼 */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              {/* 부수 정보 */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                  <span className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {radicalInfo.char}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {radicalInfo.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    부수 제{radicalNumber}번
                  </p>
                </div>
              </div>
            </div>
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="shrink-0 flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("kanji")}
            className={clsx(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors relative",
              activeTab === "kanji"
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            한자 ({relatedKanji.length})
            {activeTab === "kanji" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("words")}
            className={clsx(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors relative",
              activeTab === "words"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            연관 단어 ({relatedWords.length})
            {activeTab === "words" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {/* 한자 탭 */}
              {activeTab === "kanji" && (
                <div className="space-y-3">
                  {relatedKanji.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      이 부수를 가진 한자가 없습니다
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {relatedKanji.map((kanji) => (
                        <button
                          key={kanji.literal}
                          onClick={() => onKanjiClick(kanji)}
                          className={clsx(
                            "aspect-square flex flex-col items-center justify-center rounded-lg transition-all",
                            "bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/30",
                            "border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                          )}
                        >
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {kanji.literal}
                          </span>
                          <span
                            className={clsx(
                              "text-[10px] font-medium mt-0.5 px-1 rounded",
                              JLPT_COLORS[kanji.jlpt_level],
                              "text-white"
                            )}
                          >
                            {kanji.jlpt_level}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 연관 단어 탭 */}
              {activeTab === "words" && (
                <div className="space-y-2">
                  {relatedWords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>이 부수를 가진 한자가 포함된</p>
                      <p>JLPT 단어가 없습니다</p>
                    </div>
                  ) : (
                    relatedWords.map((word, idx) => (
                      <button
                        key={`${word.word}-${idx}`}
                        onClick={() => onWordClick?.(word)}
                        className={clsx(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          "bg-gray-50 dark:bg-gray-800",
                          "border border-gray-200 dark:border-gray-700",
                          onWordClick && "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {highlightKanji(word.word)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {word.reading}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {word.meaning}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {word.jlpt && (
                              <span
                                className={clsx(
                                  "text-xs font-medium px-1.5 py-0.5 rounded text-white",
                                  JLPT_COLORS[word.jlpt]
                                )}
                              >
                                {word.jlpt}
                              </span>
                            )}
                            {onWordClick && (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            한자를 클릭하면 상세 정보를 볼 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}
