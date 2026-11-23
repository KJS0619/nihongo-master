"use client";

import { useState } from "react";
import { LearningPlan } from "@/types/learningPlan";

interface Props {
  plan: LearningPlan;
  onSave: (plan: LearningPlan) => void;
  onClose: () => void;
}

export function SettingsModal({ plan, onSave, onClose }: Props) {
  const [targetKanji, setTargetKanji] = useState(plan.targetKanji);
  const [dailyNewCount, setDailyNewCount] = useState(plan.dailyNewCount);
  const [dailyReviewCount, setDailyReviewCount] = useState(plan.dailyReviewCount);
  const [jlptLevel, setJlptLevel] = useState(plan.jlptLevel);

  const handleSave = () => {
    onSave({
      ...plan,
      targetKanji,
      dailyNewCount,
      dailyReviewCount,
      jlptLevel,
    });
  };

  // 예상 완료일 계산
  const estimatedDays = Math.ceil(targetKanji / dailyNewCount);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">학습 설정</h2>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 목표 한자 수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목표 한자 수
            </label>
            <div className="flex items-center gap-2">
              {[500, 1000, 2000, 2136].map((num) => (
                <button
                  key={num}
                  onClick={() => setTargetKanji(num)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    targetKanji === num
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {num}자
                </button>
              ))}
            </div>
          </div>

          {/* JLPT 레벨 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              학습 대상 JLPT 레벨
            </label>
            <div className="flex items-center gap-2">
              {(["all", "N5", "N4", "N3", "N2", "N1"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setJlptLevel(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    jlptLevel === level
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level === "all" ? "전체" : level}
                </button>
              ))}
            </div>
          </div>

          {/* 하루 신규 학습 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              하루 신규 학습
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="20"
                value={dailyNewCount}
                onChange={(e) => setDailyNewCount(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-bold text-indigo-600">
                {dailyNewCount}자
              </span>
            </div>
          </div>

          {/* 하루 복습 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              하루 복습
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={dailyReviewCount}
                onChange={(e) => setDailyReviewCount(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-bold text-green-600">
                {dailyReviewCount}자
              </span>
            </div>
          </div>

          {/* 예상 완료일 */}
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              하루 {dailyNewCount}자씩 학습하면
            </p>
            <p className="text-lg font-bold text-indigo-700">
              약 {estimatedDays}일 후 완료 예상
            </p>
            <p className="text-xs text-gray-500">
              ({estimatedDate.toLocaleDateString("ko-KR")})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
