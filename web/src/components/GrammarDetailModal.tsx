"use client";

import { useState, useEffect } from "react";
import { Grammar } from "@/types/grammar";
import { loadReviewData, addItemToReview } from "@/services/reviewService";

interface GrammarDetailModalProps {
  grammar: Grammar;
  onClose: () => void;
}

type TabType = "explanation" | "conjugation" | "examples" | "practice";

export function GrammarDetailModal({ grammar, onClose }: GrammarDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("explanation");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isInReview, setIsInReview] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // 복습 목록에 있는지 확인
  useEffect(() => {
    const data = loadReviewData();
    const key = `grammar:${grammar.id}`;
    setIsInReview(!!data.progress[key]);
  }, [grammar.id]);

  // 복습에 추가
  const handleAddToReview = () => {
    const data = loadReviewData();
    addItemToReview(data, grammar.id, "grammar");
    setIsInReview(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "explanation", label: "설명", icon: "📖" },
    { id: "conjugation", label: "활용", icon: "🔄" },
    { id: "examples", label: "예문", icon: "💬" },
    { id: "practice", label: "연습", icon: "✏️" },
  ];

  const currentPractice = grammar.practice[practiceIndex];

  const handleCheckAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextPractice = () => {
    if (practiceIndex < grammar.practice.length - 1) {
      setPracticeIndex(practiceIndex + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
      setUserInput("");
    }
  };

  const isCorrect = () => {
    if (!currentPractice) return false;
    if (currentPractice.type === "fill_blank" || currentPractice.type === "choice") {
      return selectedAnswer === currentPractice.answer;
    }
    if (currentPractice.type === "translate" || currentPractice.type === "convert") {
      const normalizedInput = userInput.trim().toLowerCase();
      const normalizedAnswer = currentPractice.answer.toLowerCase();
      if (normalizedInput === normalizedAnswer) return true;
      return currentPractice.acceptableAnswers?.some(
        ans => normalizedInput === ans.toLowerCase()
      );
    }
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  {grammar.category}
                </span>
                <span className="text-xs text-gray-400">{grammar.jlpt}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {grammar.pattern}
              </h2>
              <p className="text-purple-600 dark:text-purple-400 font-medium">
                {grammar.meaning}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 탭 */}
          <div className="flex gap-1 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 설명 탭 */}
          {activeTab === "explanation" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">요약</h3>
                <p className="text-gray-700 dark:text-gray-300">{grammar.explanation.summary}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">상세 설명</h3>
                <p className="text-gray-700 dark:text-gray-300">{grammar.explanation.detail}</p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <span>🇰🇷</span> 한국어 비교
                </h3>
                <p className="text-blue-800 dark:text-blue-200">{grammar.explanation.koreanComparison}</p>
              </div>

              {grammar.explanation.commonMistakes.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <h3 className="font-bold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <span>⚠️</span> 주의할 점
                  </h3>
                  <ul className="space-y-1">
                    {grammar.explanation.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="text-red-800 dark:text-red-200 text-sm flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {mistake}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 활용 탭 */}
          {activeTab === "conjugation" && (
            <div className="space-y-2">
              {Object.entries(grammar.conjugation).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                      {value.form}
                    </p>
                  </div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">
                    {value.meaning}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 예문 탭 */}
          {activeTab === "examples" && (
            <div className="space-y-4">
              {grammar.examples.map((example, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                >
                  <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {example.ja}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {example.reading}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 font-medium">
                    {example.ko}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 연습 탭 */}
          {activeTab === "practice" && currentPractice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>문제 {practiceIndex + 1} / {grammar.practice.length}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  {currentPractice.type === "fill_blank" ? "빈칸 채우기" :
                   currentPractice.type === "translate" ? "번역" :
                   currentPractice.type === "convert" ? "변환" : "선택"}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {currentPractice.question}
                </p>

                {/* 선택형 문제 */}
                {(currentPractice.type === "fill_blank" || currentPractice.type === "choice") && currentPractice.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {currentPractice.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => !showAnswer && setSelectedAnswer(option)}
                        disabled={showAnswer}
                        className={`p-3 rounded-lg text-center font-medium transition-all ${
                          showAnswer
                            ? option === currentPractice.answer
                              ? "bg-green-500 text-white"
                              : option === selectedAnswer
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                            : selectedAnswer === option
                              ? "bg-purple-600 text-white"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {/* 입력형 문제 */}
                {(currentPractice.type === "translate" || currentPractice.type === "convert") && (
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={showAnswer}
                    placeholder="답을 입력하세요..."
                    className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                )}
              </div>

              {/* 정답 확인 */}
              {showAnswer && (
                <div className={`rounded-xl p-4 ${isCorrect() ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <p className={`font-bold mb-1 ${isCorrect() ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {isCorrect() ? "✅ 정답입니다!" : "❌ 틀렸습니다"}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    정답: <span className="font-bold">{currentPractice.answer}</span>
                  </p>
                  {currentPractice.explanation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {currentPractice.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-2">
                {!showAnswer ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer && !userInput.trim()}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    정답 확인
                  </button>
                ) : (
                  <button
                    onClick={handleNextPractice}
                    disabled={practiceIndex >= grammar.practice.length - 1}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {practiceIndex < grammar.practice.length - 1 ? "다음 문제" : "완료"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 및 태그 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* 복습 추가 버튼 */}
          <button
            onClick={handleAddToReview}
            disabled={isInReview}
            className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              justAdded
                ? "bg-green-500 text-white"
                : isInReview
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
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

          {/* 관련 태그 */}
          <div className="flex flex-wrap gap-1.5">
            {grammar.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
