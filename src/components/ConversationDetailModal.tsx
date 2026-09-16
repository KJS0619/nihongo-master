"use client";

import { useState } from "react";
import { Conversation } from "@/types/conversation";

interface ConversationDetailModalProps {
  conversation: Conversation;
  onClose: () => void;
}

type TabType = "dialogue" | "expressions" | "vocabulary" | "culture";
type PlayMode = "normal" | "shadowing" | "roleplay";

export function ConversationDetailModal({ conversation, onClose }: ConversationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dialogue");
  const [playMode, setPlayMode] = useState<PlayMode>("normal");
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [rolePlayRole, setRolePlayRole] = useState<string | null>(null);
  const [showRolePlayAnswer, setShowRolePlayAnswer] = useState(false);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "dialogue", label: "대화", icon: "💬" },
    { id: "expressions", label: "핵심표현", icon: "⭐" },
    { id: "vocabulary", label: "단어", icon: "📚" },
    { id: "culture", label: "문화", icon: "🎌" },
  ];

  const currentLine = conversation.dialogue[currentLineIndex];

  const handleNext = () => {
    if (currentLineIndex < conversation.dialogue.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
      setShowRolePlayAnswer(false);
    }
  };

  const handlePrev = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(currentLineIndex - 1);
      setShowRolePlayAnswer(false);
    }
  };

  const handleLineClick = (index: number) => {
    setCurrentLineIndex(index);
    setShowRolePlayAnswer(false);
  };

  const startRolePlay = (role: string) => {
    setRolePlayRole(role);
    setPlayMode("roleplay");
    setCurrentLineIndex(0);
    setShowRolePlayAnswer(false);
  };

  const handleShowAnswer = () => {
    setShowRolePlayAnswer(true);
  };

  const isYourLine = rolePlayRole && currentLine?.speaker === rolePlayRole;

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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-xl">
                {conversation.thumbnail}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {conversation.title}
                  <span className="text-gray-400 font-normal ml-2 text-sm">
                    {conversation.titleJa}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conversation.situation}
                </p>
              </div>
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
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white"
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
        <div className="flex-1 overflow-y-auto">
          {/* 대화 탭 */}
          {activeTab === "dialogue" && (
            <div className="p-4 space-y-4">
              {/* 모드 선택 */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setPlayMode("normal"); setRolePlayRole(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    playMode === "normal"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  📖 전체보기
                </button>
                <button
                  onClick={() => setPlayMode("shadowing")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    playMode === "shadowing"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  🎧 섀도잉
                </button>
                <button
                  onClick={() => startRolePlay("B")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    playMode === "roleplay"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  🎭 롤플레이
                </button>
              </div>

              {/* 번역 토글 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">한국어 번역</span>
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`w-10 h-6 rounded-full transition-colors ${
                    showTranslation ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${
                      showTranslation ? "translate-x-5" : "translate-x-1"
                    }`}
                  ></div>
                </button>
              </div>

              {/* 섀도잉/롤플레이 모드 */}
              {(playMode === "shadowing" || playMode === "roleplay") && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {currentLineIndex + 1} / {conversation.dialogue.length}
                    </span>
                    {playMode === "roleplay" && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isYourLine
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {isYourLine ? "당신 차례" : "상대방"}
                      </span>
                    )}
                  </div>

                  <div className={`p-4 rounded-lg ${
                    isYourLine ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-gray-700"
                  }`}>
                    <p className="text-xs text-gray-400 mb-1">
                      {currentLine?.speakerName} ({currentLine?.speakerNameReading})
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {isYourLine && playMode === "roleplay" && !showRolePlayAnswer
                        ? "..."
                        : currentLine?.ja}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {isYourLine && playMode === "roleplay" && !showRolePlayAnswer
                        ? ""
                        : currentLine?.reading}
                    </p>
                    {/* 상대방 대사 또는 정답 공개 시 번역 표시 */}
                    {(showTranslation && !isYourLine) || (isYourLine && showRolePlayAnswer && showTranslation) ? (
                      <p className="text-green-600 dark:text-green-400">
                        {currentLine?.ko}
                      </p>
                    ) : null}
                    {/* 노트 표시 */}
                    {currentLine?.note && (!isYourLine || showRolePlayAnswer) && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        💡 {currentLine.note}
                      </p>
                    )}
                  </div>

                  {/* 당신 차례일 때 버튼 */}
                  {isYourLine && !showRolePlayAnswer && (
                    <button
                      onClick={handleShowAnswer}
                      className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                    >
                      정답 보기
                    </button>
                  )}
                  {isYourLine && showRolePlayAnswer && (
                    <button
                      onClick={handleNext}
                      disabled={currentLineIndex === conversation.dialogue.length - 1}
                      className="w-full mt-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      {currentLineIndex < conversation.dialogue.length - 1 ? "다음으로 →" : "완료"}
                    </button>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handlePrev}
                      disabled={currentLineIndex === 0}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      ← 이전
                    </button>
                    <button
                      onClick={handleNext}
                      disabled={currentLineIndex === conversation.dialogue.length - 1}
                      className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      다음 →
                    </button>
                  </div>
                </div>
              )}

              {/* 전체 보기 모드 */}
              {playMode === "normal" && (
                <div className="space-y-3">
                  {conversation.dialogue.map((line, idx) => (
                    <div
                      key={line.id}
                      onClick={() => handleLineClick(idx)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        line.speaker === "A"
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "bg-green-50 dark:bg-green-900/20 ml-4"
                      } ${currentLineIndex === idx ? "ring-2 ring-green-500" : ""}`}
                    >
                      <p className="text-xs text-gray-400 mb-1">
                        {line.speakerName} ({line.speakerNameReading})
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {line.ja}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {line.reading}
                      </p>
                      {showTranslation && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                          {line.ko}
                        </p>
                      )}
                      {line.note && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          💡 {line.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 핵심표현 탭 */}
          {activeTab === "expressions" && (
            <div className="p-4 space-y-3">
              {conversation.keyExpressions.map((exp, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {exp.ja}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {exp.reading}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      exp.formality === "매우 정중" ? "bg-purple-100 text-purple-700" :
                      exp.formality === "정중" ? "bg-blue-100 text-blue-700" :
                      exp.formality === "보통" ? "bg-green-100 text-green-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {exp.formality}
                    </span>
                  </div>
                  <p className="text-green-600 dark:text-green-400 font-medium mt-2">
                    {exp.ko}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    📌 {exp.usage}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 단어 탭 */}
          {activeTab === "vocabulary" && (
            <div className="p-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
                {conversation.vocabulary.map((vocab, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {vocab.word}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {vocab.reading}
                      </p>
                    </div>
                    <p className="text-green-600 dark:text-green-400">
                      {vocab.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 문화 탭 */}
          {activeTab === "culture" && (
            <div className="p-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
                  <span>🎌</span> 문화 노트
                </h3>
                <p className="text-amber-800 dark:text-amber-200">
                  {conversation.culturalNote}
                </p>
              </div>

              {conversation.practice && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mt-4">
                  <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <span>🎭</span> 롤플레이 연습
                  </h3>
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    <strong>당신의 역할:</strong> {conversation.practice.rolePlay.yourRole}
                  </p>
                  <p className="text-purple-800 dark:text-purple-200 text-sm mt-1">
                    <strong>상황:</strong> {conversation.practice.rolePlay.situation}
                  </p>
                  <button
                    onClick={() => startRolePlay(conversation.practice.rolePlay.yourRole)}
                    className="mt-3 w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                  >
                    롤플레이 시작하기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{conversation.jlpt} · {conversation.category}</span>
            <span>약 {conversation.estimatedTime}분 · {conversation.dialogue.length}문장</span>
          </div>
        </div>
      </div>
    </div>
  );
}
