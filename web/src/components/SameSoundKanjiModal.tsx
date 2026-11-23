"use client";

import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { Kanji, JLPT_COLORS } from "@/types/kanji";
import clsx from "clsx";

// YouTube 강좌 데이터 타입
interface YoutubeLecture {
  vol: number;
  kanji?: string;
  sound?: string;
  sounds?: string[];
  count: number;
  videoId?: string;
  parts?: { part: number; videoId: string }[];
}

interface YoutubeData {
  playlists: {
    vol1: { playlist_id: string; playlist_url: string };
    vol2: { playlist_id: string; playlist_url: string };
  };
  vol1_lectures: YoutubeLecture[];
  vol2_lectures: YoutubeLecture[];
}

// 비슷한 모양 그룹 데이터 타입
interface ShapeGroup {
  vol: number;
  baseKanji: string;
  count: number;
  relatedKanji: string[];
  description: string;
}

interface ShapeGroupsData {
  version: string;
  groups: ShapeGroup[];
}

// 페이지 매핑 데이터 타입
interface PageMappingData {
  version: string;
  description: string;
  vol1: Record<string, number>;
  vol2: Record<string, number>;
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
  return parts[parts.length - 1]; // 마지막 단어가 음
}

// ========== 한글 초성/받침 분석 유틸리티 ==========
const CHOSEONG_LIST = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

// 한글 음절에서 초성 추출
function getChoseong(char: string): string | null {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return null;
  return CHOSEONG_LIST[Math.floor(code / 588)];
}

// 한글 음절에 받침이 있는지 확인
function hasBatchim(char: string): boolean {
  const code = char.charCodeAt(0) - 0xAC00;
  if (code < 0 || code > 11171) return false;
  return (code % 28) !== 0;
}

// 초성별 그룹 정의 (책의 교육적 순서)
interface ChoseongGroup {
  id: string;
  label: string;
  description: string;
  choseong: string[];
  batchimCondition: "none" | "has" | "any"; // 받침 조건
}

const CHOSEONG_GROUPS: ChoseongGroup[] = [
  { id: "g-no-batchim", label: "ㄱ (받침 없음)", description: "가, 고, 구, 기 등", choseong: ["ㄱ"], batchimCondition: "none" },
  { id: "g-with-batchim", label: "ㄱ/ㄲ (받침 있음)", description: "각, 간, 강, 깊 등", choseong: ["ㄱ", "ㄲ"], batchimCondition: "has" },
  { id: "ieung", label: "ㅇ", description: "아, 억, 용, 이 등", choseong: ["ㅇ"], batchimCondition: "any" },
  { id: "kh", label: "ㅋ/ㅎ", description: "카, 코, 하, 호 등", choseong: ["ㅋ", "ㅎ"], batchimCondition: "any" },
  { id: "dt", label: "ㄷ/ㅌ", description: "다, 도, 타, 토 등", choseong: ["ㄷ", "ㄸ", "ㅌ"], batchimCondition: "any" },
  { id: "nr", label: "ㄴ/ㄹ", description: "나, 노, 라, 로 등", choseong: ["ㄴ", "ㄹ"], batchimCondition: "any" },
  { id: "m", label: "ㅁ", description: "마, 모, 무, 미 등", choseong: ["ㅁ"], batchimCondition: "any" },
  { id: "p", label: "ㅍ", description: "파, 포, 피 등", choseong: ["ㅍ"], batchimCondition: "any" },
  { id: "b", label: "ㅂ", description: "바, 보, 비, 부 등", choseong: ["ㅂ", "ㅃ"], batchimCondition: "any" },
  { id: "s", label: "ㅅ/ㅆ", description: "사, 소, 수 등", choseong: ["ㅅ", "ㅆ"], batchimCondition: "any" },
  { id: "j", label: "ㅈ", description: "자, 조, 주, 지 등", choseong: ["ㅈ", "ㅉ"], batchimCondition: "any" },
  { id: "ch", label: "ㅊ", description: "차, 초, 추, 치 등", choseong: ["ㅊ"], batchimCondition: "any" },
];

// 가나다순 정렬용 그룹 순서
const CHOSEONG_ALPHABET_ORDER = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// 한자가 특정 그룹에 속하는지 확인
function kanjiMatchesGroup(kanji: Kanji, group: ChoseongGroup): boolean {
  const sound = extractSound(kanji.korean_hun_eum);
  if (!sound || sound.length === 0) return false;

  const firstChar = sound[0];
  const choseong = getChoseong(firstChar);
  if (!choseong) return false;

  // 초성 일치 확인
  if (!group.choseong.includes(choseong)) return false;

  // 받침 조건 확인
  if (group.batchimCondition === "none") {
    return !hasBatchim(firstChar);
  } else if (group.batchimCondition === "has") {
    return hasBatchim(firstChar);
  }
  return true; // "any"
}

// 하위 그룹 키 생성 (한국어 음 + 일본어 음독)
function getSubGroupKey(kanji: Kanji): string {
  const krSound = extractSound(kanji.korean_hun_eum) || "?";
  const jaOn = kanji.ja_on && kanji.ja_on.length > 0 ? kanji.ja_on[0] : "?";
  return `${krSound} (${jaOn})`;
}

type TabType = "sound" | "choseong" | "shape";

interface SameSoundKanjiModalProps {
  kanjiList: Kanji[];
  onClose: () => void;
  onKanjiClick?: (kanji: Kanji, fromTab: TabType, currentSound?: string | null) => void;
  initialSound?: string;
  initialTab?: TabType;
  onFlashcard?: (kanjiList: Kanji[], title: string, fromTab: TabType) => void;
  onPrint?: (chars: string[], title: string, fromTab: TabType) => void;
}

export function SameSoundKanjiModal({
  kanjiList,
  onClose,
  onKanjiClick,
  initialSound,
  initialTab = "sound",
  onFlashcard,
  onPrint,
}: SameSoundKanjiModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedSound, setSelectedSound] = useState<string | null>(initialSound || null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(CHOSEONG_GROUPS[0]?.id || null);
  const [selectedSubGroup, setSelectedSubGroup] = useState<string | null>(null); // 하위 그룹 선택
  const [searchQuery, setSearchQuery] = useState("");
  const [choseongSortAlpha, setChoseongSortAlpha] = useState(false); // false = 책 순서, true = 가나다순
  const initializedRef = useRef(false);
  const [youtubeData, setYoutubeData] = useState<YoutubeData | null>(null);
  const [showYoutubePopup, setShowYoutubePopup] = useState(false);
  const [shapeGroupsData, setShapeGroupsData] = useState<ShapeGroupsData | null>(null);
  const [selectedShapeGroup, setSelectedShapeGroup] = useState<ShapeGroup | null>(null);
  const [pageMappingData, setPageMappingData] = useState<PageMappingData | null>(null);

  // YouTube 강좌 데이터 로드
  useEffect(() => {
    fetch("/data/youtube_lectures.json")
      .then((res) => res.json())
      .then((data: YoutubeData) => setYoutubeData(data))
      .catch((err) => console.error("Failed to load YouTube data:", err));
  }, []);

  // 페이지 매핑 데이터 로드
  useEffect(() => {
    fetch("/data/kanji_page_mapping.json")
      .then((res) => res.json())
      .then((data: PageMappingData) => setPageMappingData(data))
      .catch((err) => console.error("Failed to load page mapping data:", err));
  }, []);

  // 비슷한 모양 그룹 데이터 로드
  useEffect(() => {
    fetch("/data/similar_shape_groups.json")
      .then((res) => res.json())
      .then((data: ShapeGroupsData) => {
        setShapeGroupsData(data);
        // 첫 번째 그룹 선택
        if (data.groups.length > 0 && !selectedShapeGroup) {
          setSelectedShapeGroup(data.groups[0]);
        }
      })
      .catch((err) => console.error("Failed to load shape groups data:", err));
  }, []);

  // 현재 선택된 음에 해당하는 YouTube 강좌 찾기 (Vol.1)
  const matchingYoutubeLecture = useMemo(() => {
    if (!youtubeData || !selectedSound || activeTab !== "sound") return null;

    // Vol.1에서 매칭되는 강좌 찾기 (videoId가 있는 것만)
    for (const lecture of youtubeData.vol1_lectures) {
      if (!lecture.videoId) continue;
      // sound 필드로 직접 매칭 (1-59번 강좌)
      if (lecture.sound === selectedSound) {
        return { ...lecture, volume: 1 };
      }
      // sounds 배열로 매칭 (60-96번 강좌)
      if (lecture.sounds && lecture.sounds.includes(selectedSound)) {
        return { ...lecture, volume: 1 };
      }
    }
    return null;
  }, [youtubeData, selectedSound, activeTab]);

  // 현재 선택된 비슷한 모양 그룹에 해당하는 YouTube 강좌 찾기 (Vol.2)
  const matchingVol2Lecture = useMemo(() => {
    if (!youtubeData || !selectedShapeGroup || activeTab !== "shape") return null;

    // Vol.2에서 매칭되는 강좌 찾기
    const lecture = youtubeData.vol2_lectures.find(l => l.vol === selectedShapeGroup.vol);
    if (lecture && lecture.videoId) {
      return { ...lecture, volume: 2 };
    }
    return null;
  }, [youtubeData, selectedShapeGroup, activeTab]);

  // YouTube 임베드 URL 생성 (개별 영상만 보여줌)
  const getYoutubeEmbedUrl = useCallback((lecture: YoutubeLecture & { volume: number }) => {
    if (!lecture.videoId) return "";
    // 개별 비디오 ID로 임베드 (플레이리스트 없이 해당 영상만)
    return `https://www.youtube.com/embed/${lecture.videoId}`;
  }, []);

  // YouTube 강좌가 있는 음 목록 (목록에 아이콘 표시용, videoId 있는 것만)
  const soundsWithYoutube = useMemo(() => {
    if (!youtubeData) return new Set<string>();
    const sounds = new Set<string>();
    for (const lecture of youtubeData.vol1_lectures) {
      if (!lecture.videoId) continue;
      if (lecture.sound) sounds.add(lecture.sound);
      if (lecture.sounds) lecture.sounds.forEach(s => sounds.add(s));
    }
    return sounds;
  }, [youtubeData]);

  // ========== 같은 음 탭 로직 ==========
  const kanjiBySound = useMemo(() => {
    const grouped: Record<string, Kanji[]> = {};
    kanjiList.forEach((kanji) => {
      const sound = extractSound(kanji.korean_hun_eum);
      if (sound) {
        if (!grouped[sound]) {
          grouped[sound] = [];
        }
        grouped[sound].push(kanji);
      }
    });
    return grouped;
  }, [kanjiList]);

  const sortedSounds = useMemo(() => {
    return Object.keys(kanjiBySound).sort((a, b) => a.localeCompare(b, "ko"));
  }, [kanjiBySound]);

  const filteredSounds = useMemo(() => {
    if (!searchQuery.trim()) return sortedSounds;
    const query = searchQuery.trim().toLowerCase();
    return sortedSounds.filter((sound) => sound.includes(query));
  }, [sortedSounds, searchQuery]);

  useEffect(() => {
    if (initializedRef.current || activeTab !== "sound") return;
    if (initialSound && kanjiBySound[initialSound]) {
      setSelectedSound(initialSound);
      initializedRef.current = true;
    } else if (filteredSounds.length > 0) {
      setSelectedSound(filteredSounds[0]);
      initializedRef.current = true;
    }
  }, [filteredSounds, initialSound, kanjiBySound, activeTab]);

  // initialSound가 변경되면 selectedSound 동기화 (모달 재진입 시)
  useEffect(() => {
    if (initialSound && kanjiBySound[initialSound] && activeTab === "sound") {
      setSelectedSound(initialSound);
    }
  }, [initialSound, kanjiBySound, activeTab]);

  const currentSoundKanji = useMemo(() => {
    if (selectedSound === null) return [];
    return kanjiBySound[selectedSound] || [];
  }, [kanjiBySound, selectedSound]);

  // ========== 초성별 탭 로직 ==========
  const kanjiByChoseongGroup = useMemo(() => {
    const grouped: Record<string, Kanji[]> = {};
    CHOSEONG_GROUPS.forEach((group) => {
      grouped[group.id] = kanjiList.filter((k) => kanjiMatchesGroup(k, group));
    });
    return grouped;
  }, [kanjiList]);

  // 정렬된 그룹 목록
  const sortedChoseongGroups = useMemo(() => {
    if (!choseongSortAlpha) {
      return CHOSEONG_GROUPS; // 책 순서 그대로
    }
    // 가나다순 정렬
    return [...CHOSEONG_GROUPS].sort((a, b) => {
      const aFirst = a.choseong[0];
      const bFirst = b.choseong[0];
      return CHOSEONG_ALPHABET_ORDER.indexOf(aFirst) - CHOSEONG_ALPHABET_ORDER.indexOf(bFirst);
    });
  }, [choseongSortAlpha]);

  const currentGroupKanji = useMemo(() => {
    if (!selectedGroupId) return [];
    return kanjiByChoseongGroup[selectedGroupId] || [];
  }, [kanjiByChoseongGroup, selectedGroupId]);

  const selectedGroup = CHOSEONG_GROUPS.find((g) => g.id === selectedGroupId);

  // ========== 하위 그룹 (한국어 음 + 일본어 음독) ==========
  const subGroups = useMemo(() => {
    const grouped: Record<string, Kanji[]> = {};
    currentGroupKanji.forEach((kanji) => {
      const key = getSubGroupKey(kanji);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(kanji);
    });
    // 가나다순 정렬
    const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "ko"));
    const sorted: Record<string, Kanji[]> = {};
    sortedKeys.forEach((key) => {
      sorted[key] = grouped[key];
    });
    return sorted;
  }, [currentGroupKanji]);

  const subGroupKeys = useMemo(() => Object.keys(subGroups), [subGroups]);

  // 그룹 변경 시 하위 그룹 초기화
  useEffect(() => {
    if (subGroupKeys.length > 0 && !subGroupKeys.includes(selectedSubGroup || "")) {
      setSelectedSubGroup(null); // 전체 보기로 리셋
    }
  }, [selectedGroupId, subGroupKeys, selectedSubGroup]);

  // 현재 표시할 한자 목록 (하위 그룹 선택 시 필터링)
  const displayKanjiList = useMemo(() => {
    if (!selectedSubGroup) {
      return currentGroupKanji; // 전체 보기
    }
    return subGroups[selectedSubGroup] || [];
  }, [currentGroupKanji, selectedSubGroup, subGroups]);

  // ========== 비슷한 모양 탭 로직 ==========
  const currentShapeKanji = useMemo(() => {
    if (!selectedShapeGroup) return [];
    // relatedKanji 문자열 목록에서 kanjiData와 매칭되는 한자 찾기
    return selectedShapeGroup.relatedKanji
      .map(char => kanjiList.find(k => k.literal === char))
      .filter((k): k is Kanji => k !== undefined);
  }, [selectedShapeGroup, kanjiList]);

  // ========== 공통 핸들러 ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleKanjiClick = (kanji: Kanji) => {
    if (onKanjiClick) {
      onKanjiClick(kanji, activeTab, selectedSound);
    }
  };

  // 현재 보이는 한자 목록
  const currentKanjiList = useMemo(() => {
    switch (activeTab) {
      case "sound":
        return currentSoundKanji;
      case "choseong":
        return displayKanjiList;
      case "shape":
        return currentShapeKanji;
      default:
        return [];
    }
  }, [activeTab, currentSoundKanji, displayKanjiList, currentShapeKanji]);

  // 한자의 페이지 정보 가져오기
  const getPageInfo = useCallback((kanjiChar: string): { vol: number; page: number } | null => {
    if (!pageMappingData) return null;
    if (pageMappingData.vol1[kanjiChar]) {
      return { vol: 1, page: pageMappingData.vol1[kanjiChar] };
    }
    if (pageMappingData.vol2[kanjiChar]) {
      return { vol: 2, page: pageMappingData.vol2[kanjiChar] };
    }
    return null;
  }, [pageMappingData]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop bg-black/60"
      onClick={handleBackdropClick}
    >
      <div
        className={clsx(
          "relative w-full max-w-3xl mx-4 sm:mx-0",
          "bg-white dark:bg-gray-900 rounded-2xl",
          "shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{activeTab === "sound" ? "🔊" : activeTab === "choseong" ? "🔤" : "🔷"}</span>
            {activeTab === "sound" ? "같은 음(音) 한자" : activeTab === "choseong" ? "초성별 한자" : "비슷한 모양 한자"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

        {/* 탭 전환 */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("sound")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "sound"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              🔊 같은 음
            </button>
            <button
              onClick={() => setActiveTab("choseong")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "choseong"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              🔤 초성별
            </button>
            <button
              onClick={() => setActiveTab("shape")}
              className={clsx(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                activeTab === "shape"
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              🔷 비슷한 모양
            </button>
          </div>
        </div>

        {/* 검색 & 통계 / 정렬 토글 */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          {activeTab === "sound" ? (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="음(音) 검색... (예: 사, 수, 기)"
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {sortedSounds.length}개 음 · {kanjiList.filter(k => k.korean_hun_eum).length}자
              </div>
            </div>
          ) : activeTab === "choseong" ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {CHOSEONG_GROUPS.length}개 그룹 · {kanjiList.filter(k => k.korean_hun_eum).length}자
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                <button
                  onClick={() => setChoseongSortAlpha(false)}
                  className={clsx(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    !choseongSortAlpha
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  📚 학습순서
                </button>
                <button
                  onClick={() => setChoseongSortAlpha(true)}
                  className={clsx(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    choseongSortAlpha
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  📖 가나다순
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {shapeGroupsData?.groups.length || 0}개 그룹 · Vol.2 비슷한 모양 한자
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">
                📺 YouTube 강좌 연동
              </div>
            </div>
          )}
        </div>

        {/* 메인 컨텐츠 - 2열 또는 3열 레이아웃 */}
        <div className="flex flex-1 min-h-0">
          {/* 왼쪽: 1단계 그룹 목록 */}
          <div className={clsx(
            "border-r border-gray-200 dark:border-gray-700 overflow-y-auto",
            activeTab === "choseong" ? "w-1/4" : "w-1/3"
          )}>
            <div className="p-2">
              {activeTab === "sound" ? (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                    가나다순 ({filteredSounds.length}개)
                  </div>
                  <div className="space-y-0.5">
                    {filteredSounds.map((sound) => {
                      const count = kanjiBySound[sound]?.length || 0;
                      const hasYoutube = soundsWithYoutube.has(sound);
                      return (
                        <button
                          key={sound}
                          onClick={() => setSelectedSound(sound)}
                          className={clsx(
                            "w-full px-3 py-2 text-left rounded-lg transition-all flex items-center justify-between",
                            selectedSound === sound
                              ? "bg-orange-500 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            <span className="text-lg font-bold">{sound}</span>
                            {hasYoutube && (
                              <span className="text-[10px]" title="YouTube 강좌 있음">▶️</span>
                            )}
                          </span>
                          <span
                            className={clsx(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              selectedSound === sound
                                ? "bg-orange-400 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : activeTab === "choseong" ? (
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                    {choseongSortAlpha ? "📖 가나다순" : "📚 학습순서"} ({sortedChoseongGroups.length}개)
                  </div>
                  <div className="space-y-0.5">
                    {sortedChoseongGroups.map((group, index) => {
                      const count = kanjiByChoseongGroup[group.id]?.length || 0;
                      return (
                        <button
                          key={group.id}
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setSelectedSubGroup(null); // 하위 그룹 초기화
                          }}
                          className={clsx(
                            "w-full px-2 py-1.5 text-left rounded-lg transition-all",
                            selectedGroupId === group.id
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-3">
                                {index + 1}
                              </span>
                              <span className="text-sm font-bold">{group.label}</span>
                            </div>
                            <span
                              className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                selectedGroupId === group.id
                                  ? "bg-blue-400 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              {count}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* 비슷한 모양 그룹 목록 */
                <>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                    Vol.2 순서 ({shapeGroupsData?.groups.length || 0}개)
                  </div>
                  <div className="space-y-0.5">
                    {shapeGroupsData?.groups.map((group) => {
                      const hasYoutube = youtubeData?.vol2_lectures.some(l => l.vol === group.vol && l.videoId);
                      return (
                        <button
                          key={group.vol}
                          onClick={() => setSelectedShapeGroup(group)}
                          className={clsx(
                            "w-full px-2 py-1.5 text-left rounded-lg transition-all",
                            selectedShapeGroup?.vol === group.vol
                              ? "bg-purple-500 text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={clsx(
                                "text-[10px] w-5",
                                selectedShapeGroup?.vol === group.vol
                                  ? "text-purple-200"
                                  : "text-gray-400 dark:text-gray-500"
                              )}>
                                {group.vol}
                              </span>
                              <span className="text-lg font-bold">{group.baseKanji}</span>
                              {hasYoutube && (
                                <span className="text-[10px]" title="YouTube 강좌 있음">▶️</span>
                              )}
                            </div>
                            <span
                              className={clsx(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                selectedShapeGroup?.vol === group.vol
                                  ? "bg-purple-400 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              )}
                            >
                              {group.count}
                            </span>
                          </div>
                          <div className={clsx(
                            "text-[10px] mt-0.5 truncate",
                            selectedShapeGroup?.vol === group.vol
                              ? "text-purple-200"
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            {group.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 중간: 2단계 하위 그룹 (초성별 탭에서만) */}
          {activeTab === "choseong" && (
            <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                  음(音)+음독(カナ) ({subGroupKeys.length}개)
                </div>
                {/* 전체 보기 버튼 */}
                <button
                  onClick={() => setSelectedSubGroup(null)}
                  className={clsx(
                    "w-full px-2 py-1.5 text-left rounded-lg transition-all mb-1 flex items-center justify-between",
                    selectedSubGroup === null
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  )}
                >
                  <span className="text-xs">전체 보기</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    {currentGroupKanji.length}
                  </span>
                </button>
                <div className="space-y-0.5">
                  {subGroupKeys.map((key) => {
                    const count = subGroups[key]?.length || 0;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedSubGroup(key)}
                        className={clsx(
                          "w-full px-2 py-1.5 text-left rounded-lg transition-all flex items-center justify-between",
                          selectedSubGroup === key
                            ? "bg-indigo-500 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <span className="text-sm font-medium">{key}</span>
                        <span
                          className={clsx(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            selectedSubGroup === key
                              ? "bg-indigo-400 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 오른쪽: 선택된 항목의 한자들 */}
          <div className="flex-1 overflow-y-auto">
            {currentKanjiList.length > 0 ? (
              <div className="p-4">
                {/* 헤더 */}
                <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "text-2xl font-bold",
                        activeTab === "sound" ? "text-orange-500" : activeTab === "choseong" ? "text-blue-500" : "text-purple-500"
                      )}>
                        {activeTab === "sound"
                          ? selectedSound
                          : activeTab === "choseong"
                            ? (selectedSubGroup || selectedGroup?.label)
                            : selectedShapeGroup?.baseKanji
                        }
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {currentKanjiList.length}개의 한자
                          {activeTab === "shape" && selectedShapeGroup && (
                            <span className="ml-2 text-xs text-purple-500">
                              Vol.2-{selectedShapeGroup.vol.toString().padStart(2, '0')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activeTab === "sound"
                            ? "같은 음(音)을 가진 한자들"
                            : activeTab === "choseong"
                              ? selectedSubGroup
                                ? "한국어 음 + 일본어 음독이 같은 한자들"
                                : selectedGroup?.description
                              : selectedShapeGroup?.description
                          }
                        </p>
                      </div>
                    </div>
                    {/* 액션 버튼들 */}
                    <div className="flex gap-2">
                      {onFlashcard && (
                        <button
                          onClick={() => {
                            const title = activeTab === "sound"
                              ? `음 "${selectedSound}" 한자`
                              : activeTab === "choseong"
                                ? selectedSubGroup
                                  ? `${selectedSubGroup} 한자`
                                  : `${selectedGroup?.label} 한자`
                                : `${selectedShapeGroup?.baseKanji} 비슷한 모양 한자`;
                            onFlashcard(currentKanjiList, title, activeTab);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900 transition-colors"
                          title="플래시카드로 학습"
                        >
                          🎴 학습
                        </button>
                      )}
                      {onPrint && (
                        <button
                          onClick={() => {
                            const title = activeTab === "sound"
                              ? `음 "${selectedSound}" 한자`
                              : activeTab === "choseong"
                                ? selectedSubGroup
                                  ? `${selectedSubGroup} 한자`
                                  : `${selectedGroup?.label} 한자`
                                : `${selectedShapeGroup?.baseKanji} 비슷한 모양 한자`;
                            onPrint(currentKanjiList.map(k => k.literal), title, activeTab);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          title="인쇄하기"
                        >
                          🖨️ 출력
                        </button>
                      )}
                      {/* Vol.1 YouTube 버튼 (같은 음 탭) */}
                      {matchingYoutubeLecture && (
                        <button
                          onClick={() => setShowYoutubePopup(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                          title={`YouTube 강좌: Vol.1-${matchingYoutubeLecture.vol.toString().padStart(2, '0')} (${matchingYoutubeLecture.kanji || selectedSound}) - 1타 ${matchingYoutubeLecture.count}피`}
                        >
                          ▶️ 강좌
                        </button>
                      )}
                      {/* Vol.2 YouTube 버튼 (비슷한 모양 탭) */}
                      {matchingVol2Lecture && (
                        <button
                          onClick={() => setShowYoutubePopup(true)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                          title={`YouTube 강좌: Vol.2-${matchingVol2Lecture.vol.toString().padStart(2, '0')} (${selectedShapeGroup?.baseKanji}) - ${matchingVol2Lecture.count}개 한자`}
                        >
                          ▶️ 강좌
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 한자 그리드 */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {currentKanjiList.map((kanji) => {
                    const radicalInfo = kanji.radical ? RADICAL_MAP[kanji.radical] : null;
                    const jaOnDisplay = kanji.ja_on && kanji.ja_on.length > 0 ? kanji.ja_on[0] : "";
                    return (
                      <button
                        key={kanji.unicode_hex}
                        onClick={() => handleKanjiClick(kanji)}
                        className={clsx(
                          "relative flex flex-col items-center p-2 rounded-lg transition-all",
                          "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                          activeTab === "sound"
                            ? "hover:border-orange-400 hover:shadow-md"
                            : activeTab === "choseong"
                              ? "hover:border-blue-400 hover:shadow-md"
                              : "hover:border-purple-400 hover:shadow-md",
                          onKanjiClick && "cursor-pointer"
                        )}
                      >
                        {/* JLPT 배지 */}
                        <span
                          className={clsx(
                            "absolute top-1 right-1 px-1 py-0.5 text-[8px] font-bold text-white rounded",
                            JLPT_COLORS[kanji.jlpt_level] || "bg-gray-400"
                          )}
                        >
                          {kanji.jlpt_level}
                        </span>

                        {/* 한자 */}
                        <span className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                          {kanji.literal}
                        </span>

                        {/* 훈음 */}
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate max-w-full">
                          {kanji.korean_hun_eum}
                        </span>

                        {/* 일본어 음독 */}
                        {jaOnDisplay && (
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                            {jaOnDisplay}
                          </span>
                        )}

                        {/* 부수 */}
                        {radicalInfo && (
                          <span className={clsx(
                            "text-[9px] mt-0.5",
                            activeTab === "sound"
                              ? "text-orange-600 dark:text-orange-400"
                              : activeTab === "choseong"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-purple-600 dark:text-purple-400"
                          )}>
                            {radicalInfo.char}부
                          </span>
                        )}

                        {/* 페이지 번호 */}
                        {(() => {
                          const pageInfo = getPageInfo(kanji.literal);
                          return pageInfo ? (
                            <span className="text-[8px] text-green-600 dark:text-green-400 mt-0.5 font-medium">
                              📖 {pageInfo.vol}-{pageInfo.page.toString().padStart(3, '0')}
                            </span>
                          ) : null;
                        })()}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {activeTab === "sound"
                  ? (filteredSounds.length === 0 ? "검색 결과가 없습니다" : "왼쪽에서 음을 선택하세요")
                  : activeTab === "choseong"
                    ? "왼쪽에서 그룹을 선택하세요"
                    : "왼쪽에서 비슷한 모양 그룹을 선택하세요"
                }
              </div>
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {activeTab === "sound"
              ? "같은 음(音)을 가진 한자를 모아서 학습하면 연상 기억에 도움이 됩니다"
              : activeTab === "choseong"
                ? "한국어 초성 → 하위 그룹(음+カナ)으로 세분화하여 한일 음독 대응을 학습하세요"
                : "음은 다르지만 모양이 비슷한 한자를 모아서 학습합니다 (Vol.2 연동)"
            }
          </p>
        </div>
      </div>

      {/* YouTube 팝업 모달 - Vol.1 (같은 음) */}
      {showYoutubePopup && matchingYoutubeLecture && activeTab === "sound" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setShowYoutubePopup(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">▶️</span>
                <div>
                  <h3 className="text-white font-bold">
                    Vol.1-{matchingYoutubeLecture.vol.toString().padStart(2, '0')} / 1타 {matchingYoutubeLecture.count}피 &apos;{matchingYoutubeLecture.kanji || selectedSound}&apos;
                  </h3>
                  <p className="text-gray-400 text-xs">
                    일본어한자 암기비법 - 하나를 알면 여럿을 안다
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowYoutubePopup(false)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* YouTube 임베드 */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={getYoutubeEmbedUrl(matchingYoutubeLecture)}
                title={`Vol.1-${matchingYoutubeLecture.vol} ${matchingYoutubeLecture.kanji || selectedSound}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* 하단 정보 */}
            <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                💡 &apos;{matchingYoutubeLecture.kanji || selectedSound}&apos; 한자를 기반으로 {matchingYoutubeLecture.count}개의 한자를 학습합니다
              </p>
              {matchingYoutubeLecture.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${matchingYoutubeLecture.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  YouTube에서 보기 →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* YouTube 팝업 모달 - Vol.2 (비슷한 모양) */}
      {showYoutubePopup && matchingVol2Lecture && activeTab === "shape" && selectedShapeGroup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
          onClick={() => setShowYoutubePopup(false)}
        >
          <div
            className="relative w-full max-w-4xl mx-4 bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">▶️</span>
                <div>
                  <h3 className="text-white font-bold">
                    Vol.2-{matchingVol2Lecture.vol.toString().padStart(2, '0')} / {matchingVol2Lecture.count}개 한자 &apos;{selectedShapeGroup.baseKanji}&apos;
                  </h3>
                  <p className="text-gray-400 text-xs">
                    일본어한자 암기비법 - 음은 다르지만 모양이 비슷한 한자
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowYoutubePopup(false)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* YouTube 임베드 */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={getYoutubeEmbedUrl(matchingVol2Lecture)}
                title={`Vol.2-${matchingVol2Lecture.vol} ${selectedShapeGroup.baseKanji}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {/* 하단 정보 */}
            <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                💡 &apos;{selectedShapeGroup.baseKanji}&apos; ({selectedShapeGroup.description})을 기반으로 {matchingVol2Lecture.count}개의 비슷한 모양 한자를 학습합니다
              </p>
              {matchingVol2Lecture.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${matchingVol2Lecture.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  YouTube에서 보기 →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
