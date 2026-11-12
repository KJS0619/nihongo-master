"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Story, StorySentence, DIFFICULTY_COLORS, DEFAULT_READER_SETTINGS, ReaderSettings } from "@/types/story";
import { SentenceAnalysisModal } from "@/components/story/SentenceAnalysisModal";

export default function StoryReaderPage() {
  const params = useParams();
  const storyId = params.storyId as string;

  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [selectedSentence, setSelectedSentence] = useState<StorySentence | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    async function loadStory() {
      try {
        const response = await fetch(`/data/stories/${storyId}.json`);
        if (!response.ok) throw new Error("Story not found");
        const data = await response.json();
        setStory(data);
      } catch (error) {
        console.error("Failed to load story:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStory();
  }, [storyId]);

  // TTS 재생
  const speakSentence = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = settings.ttsSpeed;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [settings.ttsSpeed]);

  const speakCurrentParagraph = useCallback(() => {
    if (!story) return;
    const paragraph = story.paragraphs[currentParagraph];
    const text = paragraph.sentences.map(s => s.text).join("");
    speakSentence(text);
  }, [story, currentParagraph, speakSentence]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const goToPrevious = () => {
    if (currentParagraph > 0) {
      setCurrentParagraph(currentParagraph - 1);
      stopSpeaking();
    }
  };

  const goToNext = () => {
    if (story && currentParagraph < story.paragraphs.length - 1) {
      setCurrentParagraph(currentParagraph + 1);
      stopSpeaking();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 dark:text-gray-400">이야기를 찾을 수 없습니다</p>
        <Link href="/learn/story" className="text-amber-600 hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const currentParagraphData = story.paragraphs[currentParagraph];
  const progress = ((currentParagraph + 1) / story.paragraphs.length) * 100;

  return (
    <div className="min-h-screen pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/learn/story" className="p-1 -ml-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {story.title}
                  <span className={`px-1.5 py-0.5 ${DIFFICULTY_COLORS[story.difficulty]} text-white text-xs rounded`}>
                    {story.difficulty}
                  </span>
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{story.titleKo}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={isSpeaking ? stopSpeaking : speakCurrentParagraph}
                className={`p-2 rounded-lg transition-colors ${
                  isSpeaking
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {isSpeaking ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mt-2">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {currentParagraph + 1} / {story.paragraphs.length}
            </p>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          {/* 일본어 문장들 */}
          <div className="space-y-4">
            {currentParagraphData.sentences.map((sentence) => (
              <div key={sentence.id} className="group">
                <button
                  onClick={() => setSelectedSentence(sentence)}
                  className="text-left w-full hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg p-2 -m-2 transition-colors"
                >
                  <p className="text-xl leading-relaxed text-gray-900 dark:text-white font-japanese">
                    {settings.furiganaMode !== "none" ? (
                      <RubyText text={sentence.text} reading={sentence.reading} />
                    ) : (
                      sentence.text
                    )}
                  </p>
                </button>
              </div>
            ))}
          </div>

          {/* 번역 토글 */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="mt-6 w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {showTranslation ? "번역 숨기기" : "번역 보기"}
          </button>

          {/* 번역 */}
          {showTranslation && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              {currentParagraphData.sentences.map((sentence) => (
                <p key={sentence.id} className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {sentence.translation}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* 문장 탭 안내 */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          문장을 탭하면 자세한 분석을 볼 수 있습니다
        </p>
      </main>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={goToPrevious}
            disabled={currentParagraph === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentParagraph + 1} / {story.paragraphs.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentParagraph === story.paragraphs.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            다음
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 문장 분석 모달 */}
      {selectedSentence && (
        <SentenceAnalysisModal
          sentence={selectedSentence}
          storyTitle={story.title}
          onClose={() => setSelectedSentence(null)}
          onSpeak={(text) => speakSentence(text)}
        />
      )}
    </div>
  );
}

// 후리가나 표시 컴포넌트
function RubyText({ text, reading }: { text: string; reading: string }) {
  // 간단한 구현: 전체 텍스트에 읽기를 루비로 표시
  // 실제로는 형태소 분석 결과를 사용해 단어별로 표시해야 함
  return (
    <ruby>
      {text}
      <rp>(</rp>
      <rt className="text-xs text-gray-500 dark:text-gray-400">{reading}</rt>
      <rp>)</rp>
    </ruby>
  );
}
