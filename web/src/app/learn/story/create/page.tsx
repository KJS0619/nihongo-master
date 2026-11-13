"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface TranslationResult {
  original: string;
  japanese: string;
  reading: string;
  sentences: {
    korean: string;
    japanese: string;
    reading: string;
  }[];
}

export default function CreateStoryPage() {
  const [inputText, setInputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSentence, setCurrentSentence] = useState<number | null>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch("/api/translate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error("번역에 실패했습니다");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setIsTranslating(false);
    }
  };

  const speakText = useCallback((text: string, index?: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    utterance.onstart = () => {
      setIsSpeaking(true);
      if (index !== undefined) setCurrentSentence(index);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentSentence(null);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const speakAll = useCallback(() => {
    if (!result) return;
    speakText(result.japanese);
  }, [result, speakText]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentSentence(null);
    }
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/learn/story" className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                ✍️ 나만의 이야기
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">한국어로 쓰면 일본어로 번역해드려요</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 입력 영역 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            한국어로 이야기를 작성하세요
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="예: 옛날 옛날에 작은 마을에 착한 소녀가 살았습니다..."
            className="w-full h-40 p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">
              {inputText.length}자
            </span>
            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isTranslating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  번역 중...
                </>
              ) : (
                <>
                  🇯🇵 일본어로 번역
                </>
              )}
            </button>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* 번역 결과 */}
        {result && (
          <div className="space-y-4">
            {/* 전체 재생 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={isSpeaking ? stopSpeaking : speakAll}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  isSpeaking
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    멈추기
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    전체 듣기
                  </>
                )}
              </button>
            </div>

            {/* 문장별 결과 */}
            <div className="space-y-3">
              {result.sentences.map((sentence, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border transition-all ${
                    currentSentence === index
                      ? "border-amber-400 dark:border-amber-500 ring-2 ring-amber-200 dark:ring-amber-900/50"
                      : "border-gray-100 dark:border-gray-700"
                  }`}
                >
                  {/* 일본어 */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xl text-gray-900 dark:text-white font-japanese leading-relaxed">
                        <ruby>
                          {sentence.japanese}
                          <rp>(</rp>
                          <rt className="text-xs text-gray-500 dark:text-gray-400">{sentence.reading}</rt>
                          <rp>)</rp>
                        </ruby>
                      </p>
                    </div>
                    <button
                      onClick={() => speakText(sentence.japanese, index)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                    >
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                    </button>
                  </div>

                  {/* 한국어 원문 */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    {sentence.korean}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안내 */}
        {!result && !isTranslating && (
          <div className="text-center py-8">
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              짧은 이야기나 일기를 작성해보세요.<br />
              AI가 자연스러운 일본어로 번역해드립니다.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
