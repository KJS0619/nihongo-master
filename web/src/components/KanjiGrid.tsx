"use client";

import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Kanji, JLPT_COLORS } from "@/types/kanji";
import clsx from "clsx";

interface KanjiDiffEntry {
  krTraditional: string;
  jpShinjitai: string;
  krSound: string;
}

interface KanjiGridProps {
  kanjiList: Kanji[];
  onKanjiClick: (kanji: Kanji) => void;
  /** 선택 모드: 카드를 누르면 열기 대신 선택/해제 */
  selectMode?: boolean;
  selected?: Set<string>;
}

// 반응형 열 수 계산
function getColumns(): number {
  if (typeof window === "undefined") return 5;
  // 모바일 단일 컬럼(max-w-lg = 512px) 기준: 좁은 화면 5열, 그 이상 6열
  const width = Math.min(window.innerWidth, 512);
  return width < 400 ? 5 : 6;
}

export function KanjiGrid({ kanjiList, onKanjiClick, selectMode = false, selected }: KanjiGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(5);
  const [diffMap, setDiffMap] = useState<Map<string, string>>(new Map());

  // 클라이언트에서 열 수 계산
  useEffect(() => {
    const updateColumns = () => setColumns(getColumns());
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // 한·일 차이 한자 데이터 로드
  useEffect(() => {
    fetch("/data/kanji_diff_full.json")
      .then((res) => res.json())
      .then((data) => {
        const map = new Map<string, string>();
        data.kanji.forEach((entry: KanjiDiffEntry) => {
          // 일본 신자체 → 한국 정자 매핑
          map.set(entry.jpShinjitai, entry.krTraditional);
        });
        setDiffMap(map);
      })
      .catch((err) => console.error("Failed to load kanji diff data:", err));
  }, []);

  const rowCount = Math.ceil(kanjiList.length / columns);

  // 가상화 설정
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 80, []),
    overscan: 5,
  });

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] min-h-[320px] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = kanjiList.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className="grid gap-1.5 sm:gap-2 px-0.5"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {rowItems.map((kanji, i) => (
                <KanjiCard
                  key={kanji.unicode_hex}
                  kanji={kanji}
                  koreanTraditional={diffMap.get(kanji.literal)}
                  selectMode={selectMode}
                  isSelected={selected?.has(kanji.literal) ?? false}
                  onClick={() => onKanjiClick(kanji)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KanjiCardProps {
  kanji: Kanji;
  koreanTraditional?: string; // 한국 정자 (차이가 있는 경우)
  selectMode?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

function KanjiCard({ kanji, koreanTraditional, selectMode, isSelected, onClick }: KanjiCardProps) {
  const hasDiff = koreanTraditional && koreanTraditional !== kanji.literal;

  return (
    <button
      onClick={onClick}
      className={clsx(
        "kanji-card relative flex flex-col items-center justify-center",
        "aspect-square rounded-lg",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "hover:border-blue-400 dark:hover:border-blue-500",
        "cursor-pointer transition-all",
        // 차이가 있는 경우 왼쪽에 파란 선 표시
        hasDiff && "border-l-2 border-l-blue-500",
        isSelected && "ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/40"
      )}
      aria-pressed={selectMode ? !!isSelected : undefined}
    >
      {/* 선택 모드 체크 표시 */}
      {selectMode && (
        <span
          className={clsx(
            "absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] leading-4 text-center font-bold",
            isSelected ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-600 text-transparent"
          )}
        >
          ✓
        </span>
      )}
      {/* JLPT 배지 */}
      <span
        className={clsx(
          "absolute top-0.5 right-0.5 px-1 py-0.5 text-[9px] font-bold text-white rounded",
          JLPT_COLORS[kanji.jlpt_level] || "bg-gray-400"
        )}
      >
        {kanji.jlpt_level}
      </span>

      {/* 한국 정자 배지 (차이가 있는 경우) - 왼쪽 상단 */}
      {hasDiff && (
        <span
          className="absolute top-0.5 left-0.5 px-1 py-0.5 text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 rounded border border-blue-300 dark:border-blue-700"
          title={`한국 정자: ${koreanTraditional}`}
        >
          {koreanTraditional}
        </span>
      )}

      {/* 한자 */}
      <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
        {kanji.literal}
      </span>

      {/* 한국어 훈음 */}
      {kanji.korean_hun_eum && (
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-full px-1">
          {kanji.korean_hun_eum}
        </span>
      )}
    </button>
  );
}
