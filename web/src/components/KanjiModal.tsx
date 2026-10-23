"use client";

import { useEffect, useCallback, useState } from "react";
import { Kanji, JLPT_COLORS } from "@/types/kanji";
import { StrokePlayer } from "./StrokePlayer";
import { DrawingCanvas } from "./DrawingCanvas";
import { loadReviewData, loadReviewDataSync, addItemToReview } from "@/services/reviewService";
import clsx from "clsx";

interface KanjiDiffEntry {
  krTraditional: string;
  jpShinjitai: string;
  krSound: string;
  diffCategory?: string;
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

// korean_hun_eum에서 음(音)만 추출
function extractSound(hunEum: string | null): string | null {
  if (!hunEum) return null;
  const parts = hunEum.split(" ");
  return parts[parts.length - 1];
}

interface KanjiModalProps {
  kanji: Kanji;
  onClose: () => void;
  onSameSoundClick?: (sound: string) => void; // 같은 음 한자 보기 클릭 시
}

type TabType = "stroke" | "draw" | "compare";
type CharVariant = "jp" | "kr";

export function KanjiModal({ kanji, onClose, onSameSoundClick }: KanjiModalProps) {
  const radicalInfo = kanji.radical ? RADICAL_MAP[kanji.radical] : null;
  const sound = extractSound(kanji.korean_hun_eum);
  const [activeTab, setActiveTab] = useState<TabType>("stroke");
  const [charVariant, setCharVariant] = useState<CharVariant>("jp");
  const [koreanTraditional, setKoreanTraditional] = useState<string | null>(null);
  const [krSound, setKrSound] = useState<string | null>(null);
  const [diffCategory, setDiffCategory] = useState<string | null>(null);
  const [isInReview, setIsInReview] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // 복습 목록에 있는지 확인
  useEffect(() => {
    async function checkReviewStatus() {
      const data = await loadReviewData();
      const key = `kanji:${kanji.literal}`;
      setIsInReview(!!data.progress[key]);
    }
    checkReviewStatus();
  }, [kanji.literal]);

  // 복습에 추가
  const handleAddToReview = async () => {
    const data = await loadReviewData();
    await addItemToReview(data, kanji.literal, "kanji");
    setIsInReview(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  // 한·일 차이 데이터 로드
  useEffect(() => {
    fetch("/data/kanji_diff_full.json")
      .then((res) => res.json())
      .then((data) => {
        const entry = data.kanji.find((e: KanjiDiffEntry) => e.jpShinjitai === kanji.literal);
        if (entry && entry.krTraditional !== kanji.literal) {
          setKoreanTraditional(entry.krTraditional);
          setKrSound(entry.krSound);
          setDiffCategory(entry.diffCategory || null);
        }
      })
      .catch((err) => console.error("Failed to load kanji diff data:", err));
  }, [kanji.literal]);

  const hasDiff = koreanTraditional !== null;

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          "relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto",
          "bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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

        {/* 헤더 */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            {/* 한자 - 차이가 있으면 두 글자 표시 */}
            <div className="flex-shrink-0">
              {hasDiff ? (
                <div className="flex items-center gap-2">
                  {/* 일본 신자체 */}
                  <div
                    className={clsx(
                      "w-20 h-20 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all",
                      charVariant === "jp"
                        ? "bg-red-50 dark:bg-red-900/30 ring-2 ring-red-400"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                    )}
                    onClick={() => setCharVariant("jp")}
                  >
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {kanji.literal}
                    </span>
                    <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">🇯🇵 日本</span>
                  </div>

                  <span className="text-gray-400 text-xl">/</span>

                  {/* 한국 정자 */}
                  <div
                    className={clsx(
                      "w-20 h-20 flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all",
                      charVariant === "kr"
                        ? "bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-400"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                    )}
                    onClick={() => setCharVariant("kr")}
                  >
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {koreanTraditional}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">🇰🇷 韓国</span>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <span className="text-6xl font-bold text-gray-900 dark:text-white">
                    {kanji.literal}
                  </span>
                </div>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex-1 min-w-0">
              {/* 한국어 훈음 - 클릭하면 같은 음 보기 */}
              {kanji.korean_hun_eum && (
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {kanji.korean_hun_eum}
                  </p>
                  {onSameSoundClick && sound && (
                    <button
                      onClick={() => onSameSoundClick(sound)}
                      className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors"
                      title={`'${sound}' 음을 가진 다른 한자 보기`}
                    >
                      같은 음
                    </button>
                  )}
                </div>
              )}

              {/* 한·일 차이 알림 */}
              {hasDiff && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mb-1 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  한·일 자형이 다릅니다
                </p>
              )}

              {/* 배지들 */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className={clsx(
                    "px-2 py-0.5 text-xs font-bold text-white rounded",
                    JLPT_COLORS[kanji.jlpt_level]
                  )}
                >
                  {kanji.jlpt_level}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {kanji.grade <= 6 ? `小${kanji.grade}` : "中学+"}
                </span>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {kanji.stroke_count}획
                </span>
                {radicalInfo && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded" title={radicalInfo.name}>
                    {radicalInfo.char}부
                  </span>
                )}
                {kanji.frequency && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    #{kanji.frequency}
                  </span>
                )}
              </div>

              {/* Unicode */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                U+{kanji.unicode_hex.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* 독음 정보 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* 음독 */}
          {kanji.ja_on.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-16 text-sm font-medium text-gray-500 dark:text-gray-400">
                音読み
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {kanji.ja_on.join(", ")}
              </span>
            </div>
          )}

          {/* 훈독 */}
          {kanji.ja_kun.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-16 text-sm font-medium text-gray-500 dark:text-gray-400">
                訓読み
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {kanji.ja_kun.join(", ")}
              </span>
            </div>
          )}

          {/* 영문 의미 */}
          {kanji.meanings_en.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-16 text-sm font-medium text-gray-500 dark:text-gray-400">
                English
              </span>
              <span className="text-sm text-gray-900 dark:text-white">
                {kanji.meanings_en.join(", ")}
              </span>
            </div>
          )}
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("stroke")}
            className={clsx(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors relative",
              activeTab === "stroke"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              획순 보기
            </span>
            {activeTab === "stroke" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("draw")}
            className={clsx(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors relative",
              activeTab === "draw"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              따라 쓰기
            </span>
            {activeTab === "draw" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
            )}
          </button>

          {/* 비교 탭 - 한·일 차이가 있을 때만 표시 */}
          {hasDiff && (
            <button
              onClick={() => setActiveTab("compare")}
              className={clsx(
                "flex-1 py-3 px-4 text-sm font-semibold transition-colors relative",
                activeTab === "compare"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                비교
              </span>
              {activeTab === "compare" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
              )}
            </button>
          )}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="p-4">
          {/* 일본 신자체 선택 시 */}
          {(!hasDiff || charVariant === "jp") && (
            <>
              {activeTab === "stroke" && kanji.stroke_paths.length > 0 && (
                <StrokePlayer kanji={kanji} />
              )}

              {activeTab === "stroke" && kanji.stroke_paths.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  획순 데이터가 없습니다
                </div>
              )}

              {activeTab === "draw" && (
                <DrawingCanvas kanji={kanji} />
              )}
            </>
          )}

          {/* 한국 정자 선택 시 */}
          {hasDiff && charVariant === "kr" && (
            <>
              {activeTab === "stroke" && (
                <div className="flex flex-col items-center py-6">
                  {/* 큰 한국 정자 표시 */}
                  <div className="w-48 h-48 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-4 border-2 border-blue-200 dark:border-blue-800">
                    <span className="text-[120px] font-bold text-gray-900 dark:text-white leading-none" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {koreanTraditional}
                    </span>
                  </div>

                  {/* 훈음 */}
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {krSound || kanji.korean_hun_eum}
                  </p>

                  {/* 안내 메시지 */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4 max-w-sm">
                    <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                      <span className="font-semibold">⚠️ 획순 데이터 없음</span>
                      <br />
                      한국 정자(正字)는 KanjiVG 데이터베이스에 포함되어 있지 않아 획순을 표시할 수 없습니다.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "draw" && (
                <div className="flex flex-col items-center py-6">
                  {/* 한국 정자 가이드 */}
                  <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                    <span className="text-[140px] font-bold text-gray-200 dark:text-gray-700 leading-none absolute" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {koreanTraditional}
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 absolute bottom-4">
                      참고용 (따라쓰기 불가)
                    </p>
                  </div>

                  {/* 안내 */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    한국 정자는 획순 데이터가 없어 따라쓰기를 지원하지 않습니다.
                    <br />
                    🇯🇵 日本 탭에서 일본 신자체로 연습해 보세요.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 비교 탭 콘텐츠 */}
          {activeTab === "compare" && hasDiff && (
            <div className="py-4">
              {/* 좌우 대비형 레이아웃 */}
              <div className="flex gap-4">
                {/* 일본 신자체 */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                    🇯🇵 日本 신자체
                  </div>
                  <div className="w-full aspect-square max-w-[160px] flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800">
                    <span className="text-[80px] font-bold text-gray-900 dark:text-white leading-none">
                      {kanji.literal}
                    </span>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {kanji.stroke_count}획
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {kanji.ja_on.length > 0 ? kanji.ja_on[0] : "-"}
                    </p>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-px h-full bg-gray-200 dark:bg-gray-700 relative">
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 한국 정자 */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                    🇰🇷 韓国 정자
                  </div>
                  <div className="w-full aspect-square max-w-[160px] flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                    <span className="text-[80px] font-bold text-gray-900 dark:text-white leading-none" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                      {koreanTraditional}
                    </span>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {krSound?.split(" ")[1] || "-"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {krSound || kanji.korean_hun_eum}
                    </p>
                  </div>
                </div>
              </div>

              {/* 차이점 설명 */}
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-purple-700 dark:text-purple-300">차이점</span>
                </div>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  {diffCategory || "획수 간략화"}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  일본에서는 1946년 당용한자표(當用漢字表) 발표 이후 간략화된 신자체(新字體)를 사용합니다.
                  한국에서는 전통적인 정자(正字)를 유지하고 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 하단 복습 버튼 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleAddToReview}
            disabled={isInReview}
            className={clsx(
              "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
              justAdded
                ? "bg-green-500 text-white"
                : isInReview
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                  : "bg-red-600 hover:bg-red-700 text-white"
            )}
          >
            {justAdded ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                추가됨!
              </>
            ) : isInReview ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                복습 목록에 있음
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                복습에 추가
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
