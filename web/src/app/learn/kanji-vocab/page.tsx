"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";

interface VocabCard {
  term: string;
  reading: string;
  meaning: string;
  mnemonic: string;
}

interface KanjiGlossaryEntry {
  hunEum: string;
  readings: string;
  description: string;
}

// Mobile sidebar state
const useMobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, toggle: () => setIsOpen(!isOpen), close: () => setIsOpen(false) };
};

const DAY_INFO = [
  { day: 1, title: "기초 한자", subtitle: "생활 한자" },
  { day: 2, title: "기초 한자", subtitle: "생활 한자" },
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

type FilterType = "all" | "new" | "known" | "due";

export default function KanjiVocabPage() {
  const [activeDay, setActiveDay] = useState(1);
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [quizMode, setQuizMode] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState("");
  const [recallFeedback, setRecallFeedback] = useState("");
  const [showRatings, setShowRatings] = useState(false);
  const [glossary, setGlossary] = useState<Record<string, KanjiGlossaryEntry>>({});
  const [loading, setLoading] = useState(true);

  // Mobile sidebar
  const sidebar = useMobileSidebar();

  // localStorage states
  const [knownSet, setKnownSet] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<Map<string, { dueAt: number; rating: string }>>(new Map());

  // Load known and reviews from localStorage
  useEffect(() => {
    const savedKnown = localStorage.getItem("kanji-vocab-known");
    const savedReviews = localStorage.getItem("kanji-vocab-reviews");
    if (savedKnown) setKnownSet(new Set(JSON.parse(savedKnown)));
    if (savedReviews) setReviews(new Map(Object.entries(JSON.parse(savedReviews))));
  }, []);

  // Load glossary
  useEffect(() => {
    fetch("/data/kanji-vocab/kanji-glossary.json")
      .then((r) => r.json())
      .then((data) => {
        const g: Record<string, KanjiGlossaryEntry> = {};
        for (const [k, v] of Object.entries(data)) {
          const [hunEum, readings, description] = v as string[];
          g[k] = { hunEum, readings, description };
        }
        setGlossary(g);
      })
      .catch(console.error);
  }, []);

  // Load day cards
  useEffect(() => {
    setLoading(true);
    const dayNum = activeDay.toString().padStart(2, "0");
    fetch(`/data/kanji-vocab/day${dayNum}.json`)
      .then((r) => r.json())
      .then((data: string[][]) => {
        setCards(
          data.map((c) => ({
            term: c[0],
            reading: c[1],
            meaning: c[2],
            mnemonic: c[3] || "",
          }))
        );
        setCurrentIndex(0);
        setFlipped(false);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, [activeDay]);

  const knownKey = useCallback((day: number, idx: number) => `${day}:${idx}`, []);
  const isKnown = useCallback((idx: number) => knownSet.has(knownKey(activeDay, idx)), [knownSet, activeDay, knownKey]);
  const isDue = useCallback(
    (idx: number) => {
      const r = reviews.get(knownKey(activeDay, idx));
      return !!r && r.dueAt <= Date.now();
    },
    [reviews, activeDay, knownKey]
  );

  const filteredCards = useMemo(() => {
    return cards
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card, index }) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "known" && isKnown(index)) ||
          (filter === "due" && isDue(index)) ||
          (filter === "new" && !isKnown(index));
        const matchesSearch =
          !searchQuery ||
          card.term.includes(searchQuery) ||
          card.reading.includes(searchQuery) ||
          card.meaning.includes(searchQuery);
        return matchesFilter && matchesSearch;
      });
  }, [cards, filter, searchQuery, isKnown, isDue]);

  const dueCount = useMemo(() => cards.filter((_, i) => isDue(i)).length, [cards, isDue]);
  const knownCount = useMemo(() => cards.filter((_, i) => isKnown(i)).length, [cards, isKnown]);

  const currentCard = cards[currentIndex];

  const toggleKnown = () => {
    const key = knownKey(activeDay, currentIndex);
    const newSet = new Set(knownSet);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setKnownSet(newSet);
    localStorage.setItem("kanji-vocab-known", JSON.stringify(Array.from(newSet)));
  };

  const rateReview = (rating: "again" | "hard" | "good" | "easy") => {
    const delay = {
      again: 10 * 60 * 1000,
      hard: 24 * 60 * 60 * 1000,
      good: 3 * 24 * 60 * 60 * 1000,
      easy: 7 * 24 * 60 * 60 * 1000,
    }[rating];
    const key = knownKey(activeDay, currentIndex);
    const newReviews = new Map(reviews);
    newReviews.set(key, { dueAt: Date.now() + delay, rating });
    setReviews(newReviews);
    localStorage.setItem("kanji-vocab-reviews", JSON.stringify(Object.fromEntries(newReviews)));
    setShowRatings(false);
  };

  const reveal = () => {
    setFlipped(!flipped);
    if (quizMode && !flipped) setShowRatings(true);
  };

  const checkRecall = () => {
    if (!recallAnswer.trim()) {
      setRecallFeedback("읽기나 뜻을 먼저 입력해 보세요.");
      return;
    }
    const normalize = (s: string) => s.toLowerCase().replace(/[\s・、,./／()（）·]/g, "");
    const options = [currentCard.reading, ...currentCard.meaning.split(/[·/、，,]/)].map(normalize);
    const correct = options.some((x) => x === normalize(recallAnswer));
    setRecallFeedback(
      correct
        ? "맞았어요! 다음에 다시 떠올릴 수 있도록 기억 정도를 골라 주세요."
        : "답을 확인하고 기억 정도를 골라 복습에 등록하세요."
    );
    if (!flipped) reveal();
  };

  const goToCard = (idx: number) => {
    setCurrentIndex((idx + cards.length) % cards.length);
    setFlipped(false);
    setShowRatings(false);
    setRecallAnswer("");
    setRecallFeedback("");
    sidebar.close(); // Close mobile sidebar when card is selected
  };

  const speakReading = () => {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(currentCard.reading.split("・")[0]);
    u.lang = "ja-JP";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") goToCard(currentIndex + 1);
      if (e.key === "ArrowLeft") goToCard(currentIndex - 1);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        reveal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, cards.length]);

  // Get kanji info from term
  const kanjiChars = useMemo(() => {
    if (!currentCard) return [];
    const chars = Array.from(currentCard.term).filter((ch) => /[\u3400-\u9fff]/.test(ch));
    return Array.from(new Set(chars));
  }, [currentCard]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/learn" className="p-1 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl">字</span>
                <span className="hidden min-[400px]:inline">한자 한 장</span>
                <span className="min-[400px]:hidden">한자</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 hidden sm:block">오늘의 일본어 단어장</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">{activeDay}일차</span>
              <span className="hidden sm:inline"> · {DAY_INFO[activeDay - 1].title}</span>
            </div>
            {/* Mobile sidebar toggle */}
            <button
              onClick={sidebar.toggle}
              className="lg:hidden p-2 -mr-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="단어 목록 열기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Day Tabs - horizontally scrollable */}
        <div className="max-w-6xl mx-auto px-2 sm:px-4 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {DAY_INFO.map((info) => (
              <button
                key={info.day}
                onClick={() => setActiveDay(info.day)}
                className={clsx(
                  "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  activeDay === info.day
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                )}
              >
                {info.day}일
                <span className="hidden sm:inline">차</span>
                <span className="hidden md:inline ml-1 opacity-70">{info.subtitle}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebar.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={sidebar.close}
        />
      )}

      {/* Mobile Sidebar Panel */}
      <div
        className={clsx(
          "fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto",
          sidebar.isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4">
          {/* Close button */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">
              오늘의 {activeDay <= 2 ? "한자" : "단어"}
            </h2>
            <button
              onClick={sidebar.close}
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="한자, 읽기, 뜻 검색"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {[
              { key: "all", label: `전체 ${cards.length}` },
              { key: "new", label: "학습 전" },
              { key: "known", label: "알고 있어요" },
              { key: "due", label: `복습 ${dueCount}` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as FilterType)}
                className={clsx(
                  "px-3 py-1.5 text-xs rounded-lg transition-all",
                  filter === f.key
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Card List */}
          <div className="space-y-1">
            {filteredCards.map(({ card, index }) => (
              <button
                key={index}
                onClick={() => goToCard(index)}
                className={clsx(
                  "w-full px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between",
                  currentIndex === index
                    ? "bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{card.term}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{card.meaning.split("·")[0]}</span>
                </div>
                {isKnown(index) && <span className="text-green-500 text-sm flex-shrink-0">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">오늘의 학습</span>
            <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
              {knownCount} / {cards.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${(knownCount / cards.length) * 100}%` }}
            />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
            {knownCount === cards.length
              ? "모든 단어를 익혔어요!"
              : knownCount > 0
              ? `${cards.length - knownCount}개가 남았어요`
              : "카드를 넘기며 시작해 보세요"}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Sidebar - Card List (Desktop only) */}
          <div className="hidden lg:block lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm h-fit">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 dark:text-white">오늘의 {activeDay <= 2 ? "한자" : "단어"}</h2>
              <span className="text-sm text-gray-500">{filteredCards.length}</span>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="한자, 읽기, 뜻 검색"
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">⌕</span>
            </div>

            {/* Filters */}
            <div className="flex gap-1 mb-3 flex-wrap">
              {[
                { key: "all", label: `전체 ${cards.length}` },
                { key: "new", label: "학습 전" },
                { key: "known", label: "알고 있어요" },
                { key: "due", label: `복습 ${dueCount}` },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as FilterType)}
                  className={clsx(
                    "px-2 py-1 text-xs rounded-lg transition-all",
                    filter === f.key
                      ? "bg-amber-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Card List */}
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {filteredCards.map(({ card, index }) => (
                <button
                  key={index}
                  onClick={() => goToCard(index)}
                  className={clsx(
                    "w-full px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between",
                    currentIndex === index
                      ? "bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{card.term}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{card.meaning.split("·")[0]}</span>
                  </div>
                  {isKnown(index) && <span className="text-green-500 text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Main Flashcard Area */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-[10px] sm:text-xs whitespace-nowrap">
                  {quizMode ? "회상 퀴즈" : "카드 학습"}
                </span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setQuizMode(!quizMode);
                    setFlipped(false);
                    setShowRatings(false);
                  }}
                  className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors whitespace-nowrap"
                >
                  <span className="hidden sm:inline">{quizMode ? "카드 학습으로" : "회상 퀴즈 시작"}</span>
                  <span className="sm:hidden">{quizMode ? "카드 학습" : "퀴즈"}</span>
                </button>
                <button
                  onClick={speakReading}
                  className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors"
                  title="읽기 듣기"
                >
                  🔊
                </button>
              </div>
            </div>

            {/* Flashcard */}
            {currentCard && (
              <div
                onClick={() => !quizMode && reveal()}
                className={clsx(
                  "bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg cursor-pointer transition-all min-h-[250px] sm:min-h-[300px]",
                  "border-2",
                  flipped ? "border-amber-400" : "border-transparent hover:border-amber-200 active:border-amber-300"
                )}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {String(currentIndex + 1).padStart(2, "0")} / {cards.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleKnown();
                    }}
                    className={clsx(
                      "text-xl sm:text-2xl transition-colors p-1",
                      isKnown(currentIndex) ? "text-amber-500" : "text-gray-300 hover:text-amber-400 active:text-amber-500"
                    )}
                  >
                    {isKnown(currentIndex) ? "★" : "☆"}
                  </button>
                </div>

                <div className="text-center space-y-2 sm:space-y-4">
                  <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    오늘의 {activeDay <= 2 ? "한자" : "단어"}
                  </p>
                  <p className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white py-2">{currentCard.term}</p>

                  {/* 읽기와 뜻은 플립 후에만 표시 */}
                  {flipped ? (
                    <>
                      <p className="text-base sm:text-xl text-indigo-600 dark:text-indigo-400">
                        {currentCard.reading.replace(/・/g, " / ")}
                      </p>
                      <p className="text-sm sm:text-lg text-gray-700 dark:text-gray-300">{currentCard.meaning}</p>
                    </>
                  ) : (
                    <p className="text-base sm:text-xl text-gray-400 dark:text-gray-500 py-4">?</p>
                  )}

                  {quizMode && !flipped && (
                    <div className="mt-3 sm:mt-4 space-y-2">
                      <label className="text-xs sm:text-sm text-gray-500">읽기 또는 뜻을 먼저 떠올려 보세요</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={recallAnswer}
                          onChange={(e) => setRecallAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && checkRecall()}
                          placeholder="생각한 답 입력"
                          className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            checkRecall();
                          }}
                          className="px-3 sm:px-4 py-2.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 active:bg-amber-700 whitespace-nowrap"
                        >
                          확인
                        </button>
                      </div>
                      {recallFeedback && <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{recallFeedback}</p>}
                    </div>
                  )}

                  {flipped && currentCard.mnemonic && (
                    <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">💡 {currentCard.mnemonic}</p>
                    </div>
                  )}

                  {!flipped && !quizMode && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-4 sm:mt-6">TAP TO REVEAL ↻</p>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => goToCard(currentIndex - 1)}
                className="px-3 sm:px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">← 이전</span>
                <span className="sm:hidden">←</span>
              </button>
              <button
                onClick={reveal}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:bg-amber-700 transition-colors text-sm sm:text-base font-medium max-w-[160px]"
              >
                {flipped ? "숨기기" : "뜻 보기"}
              </button>
              <button
                onClick={() => goToCard(currentIndex + 1)}
                className="px-3 sm:px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">다음 →</span>
                <span className="sm:hidden">→</span>
              </button>
            </div>

            {/* Review Ratings */}
            {showRatings && (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-gray-500 text-center">얼마나 기억났나요?</p>
                <div className="grid grid-cols-4 gap-1.5 sm:flex sm:items-center sm:justify-center sm:gap-2">
                  {[
                    { key: "again", label: "다시", delay: "10분" },
                    { key: "hard", label: "어려움", delay: "1일" },
                    { key: "good", label: "알았어요", delay: "3일" },
                    { key: "easy", label: "쉬워요", delay: "7일" },
                  ].map((r) => (
                    <button
                      key={r.key}
                      onClick={() => rateReview(r.key as "again" | "hard" | "good" | "easy")}
                      className="px-2 sm:px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 active:bg-gray-100 dark:active:bg-gray-500 text-xs sm:text-sm"
                    >
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-[10px] sm:text-xs text-gray-400">{r.delay}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Kanji Info Panel */}
            {kanjiChars.length > 0 && flipped && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-sm">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-3">한자 풀이</h3>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-2 sm:mb-3">
                  {kanjiChars.map((ch) => (
                    <span
                      key={ch}
                      className="px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-base sm:text-lg"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                {kanjiChars.map((ch) => {
                  const info = glossary[ch];
                  return info ? (
                    <p key={ch} className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 leading-relaxed">
                      <span className="font-bold">{ch}</span> — {info.hunEum} ({info.readings}) · {info.description}
                    </p>
                  ) : null;
                })}
              </div>
            )}

            {/* Shuffle Button */}
            <div className="text-center pb-2">
              <button
                onClick={() => goToCard(Math.floor(Math.random() * cards.length))}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 active:text-gray-900 dark:active:text-gray-100 py-2 px-4"
              >
                ⤨ 무작위로 섞기
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 text-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
        학습 기록은 이 기기에 저장됩니다. ·{" "}
        <a
          href="https://github.com/KJS0619/kanji-vocab"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-600 hover:underline"
        >
          원본 프로젝트
        </a>
      </footer>
    </div>
  );
}
