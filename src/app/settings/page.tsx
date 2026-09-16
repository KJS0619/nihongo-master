"use client";

import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(20);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode !== null
      ? savedDarkMode === "true"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(isDark);

    const savedGoal = localStorage.getItem("dailyGoal");
    if (savedGoal) setDailyGoal(parseInt(savedGoal));
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem("darkMode", String(newValue));
      if (newValue) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return newValue;
    });
  };

  const updateDailyGoal = (goal: number) => {
    setDailyGoal(goal);
    localStorage.setItem("dailyGoal", String(goal));
  };

  const clearAllData = () => {
    if (confirm("모든 학습 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      localStorage.clear();
      alert("모든 데이터가 삭제되었습니다.");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">설정</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">앱 설정 관리</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* 화면 설정 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">화면</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌙</span>
                <span className="font-medium text-gray-900 dark:text-white">다크 모드</span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-12 h-7 rounded-full transition-colors ${
                  isDarkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                    isDarkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </section>

        {/* 학습 설정 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">학습</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎯</span>
                  <span className="font-medium text-gray-900 dark:text-white">일일 목표</span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">{dailyGoal}개</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={dailyGoal}
                onChange={(e) => updateDailyGoal(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5개</span>
                <span>100개</span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔔</span>
                <span className="font-medium text-gray-900 dark:text-white">알림</span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  notificationsEnabled ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${
                    notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </section>

        {/* 데이터 관리 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">데이터</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xl">📤</span>
              <span className="font-medium text-gray-900 dark:text-white">데이터 내보내기</span>
            </button>
            <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <span className="text-xl">📥</span>
              <span className="font-medium text-gray-900 dark:text-white">데이터 가져오기</span>
            </button>
            <button
              onClick={clearAllData}
              className="w-full p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="text-xl">🗑️</span>
              <span className="font-medium text-red-600 dark:text-red-400">모든 데이터 삭제</span>
            </button>
          </div>
        </section>

        {/* 정보 */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-1">정보</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">📱</span>
                <span className="font-medium text-gray-900 dark:text-white">버전</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400">1.0.0</span>
            </div>
            <a
              href="https://github.com/KJS0619/nihongo-master"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-xl">💻</span>
              <span className="font-medium text-gray-900 dark:text-white">GitHub</span>
            </a>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
          日本語マスター © 2026
        </p>
      </main>
    </div>
  );
}
