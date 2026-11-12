"use client";

import { useState, useEffect } from "react";
import { StorySentence, ExplainResponse } from "@/types/story";

interface Props {
  sentence: StorySentence;
  storyTitle: string;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export function SentenceAnalysisModal({ sentence, storyTitle, onClose, onSpeak }: Props) {
  const [activeTab, setActiveTab] = useState<"analysis" | "ai">("analysis");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<ExplainResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 프리셋 질문들
  const presetQuestions = [
    "이 문장을 자세히 설명해줘",
    "왜 이런 표현을 썼어?",
    "다른 표현은 없어?",
    "문법 포인트가 뭐야?",
  ];

  const handleAskAi = async (question: string) => {
    setIsLoadingAi(true);
    setAiError(null);

    try {
      const response = await fetch("/api/explain-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sentence: sentence.text,
          question,
          context: storyTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("AI 응답을 받지 못했습니다");
      }

      const data = await response.json();
      setAiResponse(data);
      setActiveTab("ai");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">문장 분석</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 원문 */}
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <p className="text-lg text-gray-900 dark:text-white font-japanese">{sentence.text}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sentence.reading}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">{sentence.translation}</p>
          </div>

          {/* TTS 버튼 */}
          <button
            onClick={() => onSpeak(sentence.text)}
            className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            발음 듣기
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("analysis")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "analysis"
                ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            기본 분석
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "ai"
                ? "text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            AI 설명
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "analysis" ? (
            <div className="space-y-4">
              {/* 형태소 분석 (토큰 정보가 있을 때) */}
              {sentence.tokens && sentence.tokens.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">형태소 분석</h3>
                  <div className="flex flex-wrap gap-2">
                    {sentence.tokens.map((token, idx) => (
                      <div
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{token.surface}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({token.pos})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  형태소 분석 데이터가 없습니다. AI 설명 탭에서 분석을 요청해보세요.
                </p>
              )}

              {/* 문법 노트 */}
              {sentence.grammarNotes && sentence.grammarNotes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">문법 포인트</h3>
                  <div className="space-y-2">
                    {sentence.grammarNotes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{note.pattern}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{note.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 질문 프리셋 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">AI에게 질문하기</h3>
                <div className="flex flex-wrap gap-2">
                  {presetQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAskAi(q)}
                      disabled={isLoadingAi}
                      className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 직접 질문 입력 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="AI에게 질문하기..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && aiQuestion.trim()) {
                      handleAskAi(aiQuestion);
                    }
                  }}
                />
                <button
                  onClick={() => aiQuestion.trim() && handleAskAi(aiQuestion)}
                  disabled={isLoadingAi || !aiQuestion.trim()}
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {isLoadingAi ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "질문"
                  )}
                </button>
              </div>

              {/* AI 응답 */}
              {isLoadingAi && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
                </div>
              )}

              {aiResponse && (
                <div className="space-y-4">
                  {/* 메인 설명 */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {aiResponse.explanation}
                    </p>
                  </div>

                  {/* 문법 포인트 */}
                  {aiResponse.grammarPoints && aiResponse.grammarPoints.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">문법 포인트</h4>
                      <div className="space-y-2">
                        {aiResponse.grammarPoints.map((gp, idx) => (
                          <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-purple-700 dark:text-purple-300">{gp.pattern}</span>
                              <span className="px-1.5 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-xs rounded">
                                {gp.jlptLevel}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{gp.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 어휘 */}
                  {aiResponse.vocabulary && aiResponse.vocabulary.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">어휘</h4>
                      <div className="space-y-2">
                        {aiResponse.vocabulary.map((v, idx) => (
                          <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-blue-700 dark:text-blue-300">{v.word}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{v.reading}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{v.meaning}</p>
                            {v.note && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{v.note}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 문화 노트 */}
                  {aiResponse.culturalNote && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">문화 배경</h4>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{aiResponse.culturalNote}</p>
                      </div>
                    </div>
                  )}

                  {/* 다른 표현 */}
                  {aiResponse.alternativeExpressions && aiResponse.alternativeExpressions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">다른 표현</h4>
                      <div className="space-y-2">
                        {aiResponse.alternativeExpressions.map((alt, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{alt.expression}</span>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{alt.meaning}</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{alt.nuance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!aiResponse && !isLoadingAi && !aiError && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>위의 질문 버튼을 누르거나 직접 질문을 입력하세요</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
