"use client";

import { useState, useEffect, useMemo } from "react";
import { Kanji } from "@/types/kanji";
import { DailySession, LEARNING_STEPS, LearningStep } from "@/types/learningPlan";
import { markKanjiCompleted } from "@/services/learningPlanService";
import { DrawingCanvas } from "@/components/DrawingCanvas";
import { useKanjiTTS } from "@/hooks/useKanjiTTS";

interface Props {
  session: DailySession;
  sessionType: "new" | "review" | "all";
  kanjiData: Kanji[];
  onClose: () => void;
}

export function LearningSessionModal({ session, sessionType, kanjiData, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [completedInSession, setCompletedInSession] = useState<Set<string>>(new Set());

  const { speak } = useKanjiTTS();

  // 학습할 한자 목록 (신규/복습/전체)
  const kanjiList = useMemo(() => {
    const newList = session.newKanji.filter(k => !session.completedNew.includes(k));
    const reviewList = session.reviewKanji.filter(k => !session.completedReview.includes(k));

    switch (sessionType) {
      case "new":
        return newList.map(k => ({ kanji: k, isNew: true }));
      case "review":
        return reviewList.map(k => ({ kanji: k, isNew: false }));
      case "all":
      default:
        return [
          ...newList.map(k => ({ kanji: k, isNew: true })),
          ...reviewList.map(k => ({ kanji: k, isNew: false })),
        ];
    }
  }, [session, sessionType]);

  // 현재 한자
  const currentItem = kanjiList[currentIndex];
  const currentKanji = useMemo(() => {
    if (!currentItem) return null;
    return kanjiData.find(k => k.literal === currentItem.kanji) || null;
  }, [currentItem, kanjiData]);

  // 현재 스텝
  const step = LEARNING_STEPS[currentStep];

  // 진행률
  const progress = useMemo(() => {
    const total = kanjiList.length;
    const completed = completedInSession.size;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [kanjiList, completedInSession]);

  // 다음 스텝/한자로 이동
  const handleNext = () => {
    if (currentStep < LEARNING_STEPS.length - 2) {
      // 다음 스텝
      setCurrentStep(prev => prev + 1);
      setShowAnswer(false);
      setQuizAnswer("");
      setIsCorrect(null);
    } else {
      // 완료 스텝
      setCurrentStep(LEARNING_STEPS.length - 1);
    }
  };

  // 한자 완료 처리
  const handleComplete = (correct: boolean) => {
    if (!currentItem) return;

    // 진도 저장
    markKanjiCompleted(currentItem.kanji, currentItem.isNew, correct);

    // 완료 목록에 추가
    setCompletedInSession(prev => {
      const newSet = new Set(prev);
      newSet.add(currentItem.kanji);
      return newSet;
    });

    // 다음 한자로
    if (currentIndex < kanjiList.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentStep(0);
      setShowAnswer(false);
      setQuizAnswer("");
      setIsCorrect(null);
    } else {
      // 모든 학습 완료
      onClose();
    }
  };

  // 퀴즈 정답 확인
  const checkQuizAnswer = () => {
    if (!currentKanji) return;

    const correctAnswers = [
      ...currentKanji.ja_on,
      ...currentKanji.ja_kun.map(r => r.split(".")[0]),
      ...(currentKanji.korean_hun_eum || "").split(",").map(r => r.trim()),
    ].filter(Boolean).map(r => r.toLowerCase().trim());

    const userAnswer = quizAnswer.toLowerCase().trim();
    const isAnswerCorrect = correctAnswers.some(a => a === userAnswer || a.includes(userAnswer));

    setIsCorrect(isAnswerCorrect);
    setShowAnswer(true);
  };

  // TTS 재생
  const handleSpeak = (text: string) => {
    speak(text);
  };

  if (!currentKanji || !currentItem) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <p className="text-xl font-bold mb-4">🎉 학습 완료!</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                currentItem.isNew ? "bg-blue-400" : "bg-green-400"
              }`}>
                {currentItem.isNew ? "신규" : "복습"}
              </span>
              <span className="text-sm opacity-90">
                {currentIndex + 1} / {kanjiList.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 진행률 */}
          <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          {/* 스텝 표시 */}
          <div className="flex justify-between mt-3">
            {LEARNING_STEPS.slice(0, -1).map((s, i) => (
              <div
                key={s.step}
                className={`flex-1 text-center text-xs ${
                  i === currentStep
                    ? "font-bold"
                    : i < currentStep
                    ? "opacity-60"
                    : "opacity-40"
                }`}
              >
                {i < currentStep ? "✓" : s.step}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: 모양 & 뜻 */}
          {step.type === "meaning" && (
            <div className="text-center">
              <div className="text-9xl font-serif mb-6">{currentKanji.literal}</div>
              <div className="text-xl text-gray-700 mb-2">
                {currentKanji.korean_hun_eum && (
                  <span className="text-indigo-600 font-bold mr-2">
                    [{currentKanji.korean_hun_eum}]
                  </span>
                )}
              </div>
              <div className="text-gray-600">
                {currentKanji.meanings_en.slice(0, 3).join(", ")}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {currentKanji.jlpt_level && `JLPT ${currentKanji.jlpt_level}`}
                {currentKanji.grade && ` · ${currentKanji.grade}학년`}
              </div>
            </div>
          )}

          {/* Step 2: 음독 & 훈독 */}
          {step.type === "reading" && (
            <div className="text-center">
              <div className="text-7xl font-serif mb-6">{currentKanji.literal}</div>

              <div className="space-y-4">
                {currentKanji.ja_on.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm text-blue-600 font-medium mb-2">음독 (音読み)</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentKanji.ja_on.map((reading, i) => (
                        <button
                          key={i}
                          onClick={() => handleSpeak(reading)}
                          className="px-3 py-1 bg-white border border-blue-200 rounded-full text-lg hover:bg-blue-100 transition-colors"
                        >
                          {reading} 🔊
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentKanji.ja_kun.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm text-green-600 font-medium mb-2">훈독 (訓読み)</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {currentKanji.ja_kun.map((reading, i) => (
                        <button
                          key={i}
                          onClick={() => handleSpeak(reading.split(".")[0])}
                          className="px-3 py-1 bg-white border border-green-200 rounded-full text-lg hover:bg-green-100 transition-colors"
                        >
                          {reading} 🔊
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: 단어 예시 */}
          {step.type === "words" && (
            <div>
              <div className="text-center mb-6">
                <span className="text-5xl font-serif">{currentKanji.literal}</span>
              </div>

              <div className="text-sm text-gray-600 mb-3">읽기와 의미 복습</div>

              <div className="space-y-4">
                {/* 음독 단어 예시 */}
                {currentKanji.ja_on.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-sm text-blue-600 font-medium mb-2">음독으로 읽는 경우</div>
                    <div className="text-lg">
                      {currentKanji.literal}
                      <span className="text-blue-600 ml-2">({currentKanji.ja_on[0]})</span>
                    </div>
                  </div>
                )}

                {/* 훈독 단어 예시 */}
                {currentKanji.ja_kun.length > 0 && (
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-sm text-green-600 font-medium mb-2">훈독으로 읽는 경우</div>
                    <div className="text-lg">
                      {currentKanji.literal}
                      <span className="text-green-600 ml-2">({currentKanji.ja_kun[0]})</span>
                    </div>
                  </div>
                )}

                {/* 의미 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 font-medium mb-2">의미</div>
                  <div className="text-lg">
                    {currentKanji.meanings_en.join(", ")}
                  </div>
                  {currentKanji.korean_hun_eum && (
                    <div className="text-indigo-600 mt-1">
                      한국어: {currentKanji.korean_hun_eum}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 읽기 테스트 */}
          {step.type === "quiz" && (
            <div className="text-center">
              <div className="text-8xl font-serif mb-6">{currentKanji.literal}</div>

              <p className="text-gray-600 mb-4">이 한자의 읽기를 입력하세요</p>

              <input
                type="text"
                value={quizAnswer}
                onChange={(e) => setQuizAnswer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !showAnswer && checkQuizAnswer()}
                placeholder="히라가나, 카타카나, 또는 한글"
                className="w-full px-4 py-3 border-2 rounded-xl text-center text-xl focus:border-indigo-500 focus:outline-none"
                disabled={showAnswer}
              />

              {!showAnswer ? (
                <button
                  onClick={checkQuizAnswer}
                  disabled={!quizAnswer.trim()}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                >
                  확인
                </button>
              ) : (
                <div className={`mt-4 p-4 rounded-xl ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                  <div className={`text-lg font-bold ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                    {isCorrect ? "정답! 🎉" : "오답 😅"}
                  </div>
                  <div className="text-sm mt-2 text-gray-700">
                    정답: {currentKanji.ja_on.join(", ")}
                    {currentKanji.ja_kun.length > 0 && (
                      <> / {currentKanji.ja_kun.join(", ")}</>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: 쓰기 연습 */}
          {step.type === "writing" && (
            <div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-6xl font-serif text-gray-300">{currentKanji.literal}</span>
                <span className="text-gray-400">→</span>
                <div className="text-sm text-gray-600">직접 써보세요</div>
              </div>

              <DrawingCanvas kanji={currentKanji} />

              <p className="text-center text-sm text-gray-500 mt-2">
                획순을 생각하며 써보세요
              </p>
            </div>
          )}

          {/* Step 6: 완료 */}
          {step.type === "complete" && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎊</div>
              <div className="text-7xl font-serif mb-4">{currentKanji.literal}</div>
              <p className="text-gray-600 mb-6">학습을 완료했습니다!</p>

              <div className="text-sm text-gray-500 mb-4">
                얼마나 잘 기억하셨나요?
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleComplete(false)}
                  className="py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors"
                >
                  😓 다시 복습
                </button>
                <button
                  onClick={() => handleComplete(true)}
                  className="py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors"
                >
                  😊 잘 기억함
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step.type !== "complete" && (
          <div className="p-4 border-t bg-gray-50">
            <button
              onClick={handleNext}
              disabled={step.type === "quiz" && !showAnswer}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep < LEARNING_STEPS.length - 2 ? "다음 단계" : "완료하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
