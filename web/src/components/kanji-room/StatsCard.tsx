"use client";

import { useMemo } from "react";
import { getWeeklyStats } from "@/services/learningPlanService";

export function StatsCard() {
  const weeklyData = useMemo(() => getWeeklyStats(), []);

  const maxCount = useMemo(() => {
    const max = Math.max(...weeklyData.map((d) => d.newCount + d.reviewCount));
    return max > 0 ? max : 10;
  }, [weeklyData]);

  const totalThisWeek = useMemo(() => {
    return weeklyData.reduce((sum, d) => sum + d.newCount + d.reviewCount, 0);
  }, [weeklyData]);

  const getDayName = (dateStr: string) => {
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split("T")[0];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📈 주간 학습</h3>
        <span className="text-sm text-gray-500">총 {totalThisWeek}자</span>
      </div>

      {/* 바 차트 */}
      <div className="flex items-end justify-between h-32 gap-1">
        {weeklyData.map((day) => {
          const total = day.newCount + day.reviewCount;
          const height = maxCount > 0 ? (total / maxCount) * 100 : 0;
          const newHeight = total > 0 ? (day.newCount / total) * height : 0;
          const reviewHeight = height - newHeight;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center"
            >
              {/* 바 */}
              <div
                className="w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                style={{ height: `${Math.max(height, 4)}%` }}
              >
                {/* 신규 (아래) */}
                <div
                  className="w-full bg-blue-400"
                  style={{ height: `${newHeight}%` }}
                />
                {/* 복습 (위) */}
                <div
                  className="w-full bg-green-400"
                  style={{ height: `${reviewHeight}%` }}
                />
              </div>

              {/* 숫자 */}
              <div className="text-xs text-gray-600 mt-1">
                {total > 0 ? total : "-"}
              </div>

              {/* 요일 */}
              <div
                className={`text-xs mt-0.5 ${
                  isToday(day.date)
                    ? "font-bold text-indigo-600"
                    : "text-gray-400"
                }`}
              >
                {getDayName(day.date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-400 rounded" />
          신규
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-400 rounded" />
          복습
        </span>
      </div>
    </div>
  );
}
