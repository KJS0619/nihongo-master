"use client";

import { useState, useEffect } from "react";
import { SimpleWord } from "./KanjiModal";
import { JLPT_COLORS, Kanji } from "@/types/kanji";
import clsx from "clsx";

interface SimpleWordModalProps {
  word: SimpleWord;
  onClose: () => void;
  onBack?: () => void; // 뒤로가기 (KanjiModal로 돌아가기)
  onKanjiClick?: (kanji: Kanji) => void; // 한자 클릭 시
}

export function SimpleWordModal({ word, onClose, onBack, onKanjiClick }: SimpleWordModalProps) {
  const [showReading, setShowReading] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [kanjiList, setKanjiList] = useState<Kanji[]>([]);
  const [loading, setLoading] = useState(true);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (onBack) onBack();
        else onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, onBack]);

  // 단어에 포함된 한자 정보 로드
  useEffect(() => {
    async function loadKanjiInfo() {
      setLoading(true);
      try {
        const response = await fetch("/data/kanji_master.json");
        const data = await response.json();
        const allKanji: Kanji[] = data.kanji || [];

        // 단어에 포함된 한자만 필터링
        const kanjiInWord = word.word.split("").filter(char => {
          // 한자인지 확인 (CJK Unified Ideographs 범위)
          const code = char.charCodeAt(0);
          return (code >= 0x4E00 && code <= 0x9FFF) ||
                 (code >= 0x3400 && code <= 0x4DBF);
        });

        const foundKanji = kanjiInWord
          .map(char => allKanji.find(k => k.literal === char))
          .filter((k): k is Kanji => k !== undefined);

        setKanjiList(foundKanji);
      } catch (err) {
        console.error("Failed to load kanji data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadKanjiInfo();
  }, [word.word]);

  // 후리가나를 한자 위에 표시하는 함수
  const renderWithFurigana = (text: string, reading: string) => {
    // 간단한 방식: 한자와 히라가나를 매칭
    const kanjiChars = text.split("").filter(char => {
      const code = char.charCodeAt(0);
      return (code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF);
    });

    if (kanjiChars.length === 0) {
      return <span>{text}</span>;
    }

    // 단어 전체에 후리가나 표시
    return (
      <ruby className="text-3xl">
        {text}
        <rt className="text-sm text-gray-500 dark:text-gray-400">{reading}</rt>
      </ruby>
    );
  };

  const levelColors: Record<string, string> = {
    "N5": "bg-green-500",
    "N4": "bg-blue-500",
    "N3": "bg-yellow-500",
    "N2": "bg-orange-500",
    "N1": "bg-red-500",
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center modal-backdrop bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (onBack) onBack();
          else onClose();
        }
      }}
    >
      <div
        className={clsx(
          "relative w-full sm:max-w-lg max-h-[85dvh] flex flex-col overflow-hidden",
          "bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl",
          "shadow-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            {/* 뒤로가기 버튼 */}
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <span className={clsx(
              "px-2 py-1 rounded text-xs font-bold text-white",
              levelColors[word.jlpt] || "bg-gray-500"
            )}>
              {word.jlpt}
            </span>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 단어 표시 */}
          <div className="text-center py-4">
            {showReading ? (
              renderWithFurigana(word.word, word.reading)
            ) : (
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{word.word}</span>
            )}

            {showMeaning && (
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mt-3">
                {word.meaning}
              </p>
            )}
          </div>

          {/* 토글 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowReading(!showReading)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                showReading
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
            >
              읽기 {showReading ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setShowMeaning(!showMeaning)}
              className={clsx(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-colors",
                showMeaning
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              )}
            >
              뜻 {showMeaning ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* 한자 정보 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : kanjiList.length > 0 ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                <span>📝</span> 포함된 한자
              </h3>
              <div className="space-y-2">
                {kanjiList.map((k, idx) => (
                  <button
                    key={idx}
                    onClick={() => onKanjiClick?.(k)}
                    className={clsx(
                      "w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-3 text-left transition-colors",
                      onKanjiClick && "hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer"
                    )}
                  >
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{k.literal}</span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {k.korean_hun_eum || "-"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {k.meanings_en?.slice(0, 3).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={clsx(
                        "text-xs font-medium px-1.5 py-0.5 rounded text-white",
                        JLPT_COLORS[k.jlpt_level]
                      )}>
                        {k.jlpt_level}
                      </span>
                      {onKanjiClick && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>이 단어에 포함된 한자 정보가 없습니다</p>
            </div>
          )}

          {/* 단어 정보 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>📚</span> 단어 정보
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">단어</span>
                <span className="font-medium text-gray-900 dark:text-white">{word.word}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">읽기</span>
                <span className="font-medium text-gray-900 dark:text-white">{word.reading}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">의미</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{word.meaning}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">JLPT 레벨</span>
                <span className={clsx(
                  "font-bold px-2 py-0.5 rounded text-white text-xs",
                  levelColors[word.jlpt] || "bg-gray-500"
                )}>
                  {word.jlpt}
                </span>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-2">
            <p>예문 데이터가 추가되면 더 많은 정보를 볼 수 있습니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}
