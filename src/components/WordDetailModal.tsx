"use client";

import { useState, useEffect } from "react";
import { JlptWord } from "@/types/word";
import { loadReviewData, addItemToReview, getProgress } from "@/services/reviewService";

interface WordDetailModalProps {
  word: JlptWord;
  onClose: () => void;
}

type TabType = "info" | "examples" | "conjugation" | "quiz";

export function WordDetailModal({ word, onClose }: WordDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [showReading, setShowReading] = useState(true);
  const [showMeaning, setShowMeaning] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);
  const [quizType, setQuizType] = useState<"meaning" | "reading">("meaning");
  const [isInReview, setIsInReview] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // 복습 목록에 있는지 확인
  useEffect(() => {
    const data = loadReviewData();
    const key = `word:${word.id}`;
    setIsInReview(!!data.progress[key]);
  }, [word.id]);

  // 복습에 추가
  const handleAddToReview = () => {
    const data = loadReviewData();
    addItemToReview(data, word.id, "word");
    setIsInReview(true);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "info", label: "정보", icon: "📖" },
    { id: "examples", label: "예문", icon: "💬" },
    { id: "conjugation", label: "활용", icon: "🔄" },
    { id: "quiz", label: "퀴즈", icon: "✏️" },
  ];

  const handleQuizCheck = () => {
    const normalizedAnswer = quizAnswer.trim().toLowerCase();
    let isCorrect = false;

    if (quizType === "meaning") {
      isCorrect = word.meaning.toLowerCase().includes(normalizedAnswer) && normalizedAnswer.length > 0;
    } else {
      isCorrect = normalizedAnswer === word.reading.toLowerCase();
    }

    setQuizResult(isCorrect ? "correct" : "incorrect");
  };

  const handleQuizReset = () => {
    setQuizAnswer("");
    setQuizResult(null);
    setQuizType(quizType === "meaning" ? "reading" : "meaning");
  };

  const levelColors: Record<string, string> = {
    "N5": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "N4": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "N3": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "N2": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "N1": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[word.jlpt]}`}>
                  {word.jlpt}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                  {word.category}
                </span>
                {word.verbType && (
                  <span className="text-xs text-gray-400">{word.verbType}</span>
                )}
                {word.adjectiveType && (
                  <span className="text-xs text-gray-400">{word.adjectiveType}</span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {word.word}
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {word.reading}
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                {word.meaning}
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
                    ? "bg-blue-600 text-white"
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
          {/* 정보 탭 */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* 상세 의미 */}
              {word.meaningDetail && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">상세 의미</h3>
                  <p className="text-gray-700 dark:text-gray-300">{word.meaningDetail}</p>
                </div>
              )}

              {/* 한자 정보 */}
              {word.kanji && word.kanji.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-3 flex items-center gap-2">
                    <span>📝</span> 한자 정보
                  </h3>
                  <div className="space-y-2">
                    {word.kanji.map((k, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-3">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{k.char}</span>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{k.reading}</p>
                          <p className="text-amber-700 dark:text-amber-300 font-medium">{k.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 관련 단어 */}
              {word.relatedWords && word.relatedWords.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <span>🔗</span> 관련 단어
                  </h3>
                  <div className="space-y-2">
                    {word.relatedWords.map((rw, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white">{rw.word}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{rw.reading}</span>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            rw.relation === "유의어" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                            rw.relation === "반의어" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                            "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                            {rw.relation}
                          </span>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">{rw.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 태그 */}
              {word.tags && word.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {word.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 예문 탭 */}
          {activeTab === "examples" && (
            <div className="space-y-4">
              {/* 토글 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReading(!showReading)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    showReading
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  읽기 {showReading ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => setShowMeaning(!showMeaning)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    showMeaning
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  뜻 {showMeaning ? "ON" : "OFF"}
                </button>
              </div>

              {word.examples.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  예문이 없습니다
                </div>
              ) : (
                word.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                  >
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {example.ja}
                    </p>
                    {showReading && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {example.reading}
                      </p>
                    )}
                    {showMeaning && (
                      <p className="text-blue-600 dark:text-blue-400 font-medium">
                        {example.ko}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 활용 탭 */}
          {activeTab === "conjugation" && (
            <div className="space-y-2">
              {!word.conjugations || word.conjugations.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  활용형 정보가 없습니다
                </div>
              ) : (
                word.conjugations.map((conj, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        {conj.form}
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {conj.value}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {conj.reading}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 퀴즈 탭 */}
          {activeTab === "quiz" && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {quizType === "meaning" ? "뜻 맞추기" : "읽기 맞추기"}
                  </span>
                  <button
                    onClick={() => {
                      setQuizType(quizType === "meaning" ? "reading" : "meaning");
                      setQuizAnswer("");
                      setQuizResult(null);
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    모드 변경
                  </button>
                </div>

                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {word.word}
                  </p>
                  {quizType === "meaning" && (
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                      {word.reading}
                    </p>
                  )}
                  {quizType === "reading" && (
                    <p className="text-lg text-blue-600 dark:text-blue-400">
                      {word.meaning}
                    </p>
                  )}
                </div>

                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !quizResult && handleQuizCheck()}
                  disabled={quizResult !== null}
                  placeholder={quizType === "meaning" ? "뜻을 입력하세요..." : "읽기(히라가나)를 입력하세요..."}
                  className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>

              {/* 결과 */}
              {quizResult && (
                <div className={`rounded-xl p-4 ${
                  quizResult === "correct"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                }`}>
                  <p className={`font-bold mb-1 ${
                    quizResult === "correct"
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}>
                    {quizResult === "correct" ? "정답입니다!" : "틀렸습니다"}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    정답: <span className="font-bold">
                      {quizType === "meaning" ? word.meaning : word.reading}
                    </span>
                  </p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex gap-2">
                {!quizResult ? (
                  <button
                    onClick={handleQuizCheck}
                    disabled={!quizAnswer.trim()}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    정답 확인
                  </button>
                ) : (
                  <button
                    onClick={handleQuizReset}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium"
                  >
                    다음 문제
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={handleAddToReview}
              disabled={isInReview}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                justAdded
                  ? "bg-green-500 text-white"
                  : isInReview
                    ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
                    : "bg-green-600 hover:bg-green-700 text-white"
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
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            <span>빈도 순위: #{word.frequency}</span>
            <span>{word.examples.length}개의 예문</span>
          </div>
        </div>
      </div>
    </div>
  );
}
