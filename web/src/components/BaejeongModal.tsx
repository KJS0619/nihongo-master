"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import type { Kanji } from "@/types/kanji";
import { HanjaBookPrintModal } from "@/components/HanjaBookPrintModal";

/** public/data/baejeong.json 행: [한자, 대표음, 급수코드, 대표훈음, 부수, 부수외획수, 총획] */
type Row = [string, string, string, string, string, number, number];

const GRADE_LABEL: Record<string, string> = {
  "80": "8급", "72": "7급Ⅱ", "70": "7급", "62": "6급Ⅱ", "60": "6급", "52": "5급Ⅱ", "50": "5급",
  "42": "4급Ⅱ", "40": "4급", "32": "3급Ⅱ", "30": "3급", "20": "2급", "12": "2급", "10": "1급",
  "02": "특급Ⅱ", "00": "특급",
};
/** 쉬운 급수 → 어려운 급수 */
const GRADE_ORDER = ["8급", "7급Ⅱ", "7급", "6급Ⅱ", "6급", "5급Ⅱ", "5급", "4급Ⅱ", "4급", "3급Ⅱ", "3급", "2급", "1급", "특급Ⅱ", "특급"];
const gradeRank = (code: string) => GRADE_ORDER.indexOf(GRADE_LABEL[code] ?? "");

interface JpInfo { jp: string; on: string[]; kun: string[]; jlpt: string; stroke: number }

interface Props {
  onClose: () => void;
}

export function BaejeongModal({ onClose }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [jpMap, setJpMap] = useState<Map<string, JpInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printChars, setPrintChars] = useState<string[] | null>(null);
  const [columns, setColumns] = useState(5);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const upd = () => setColumns(Math.min(window.innerWidth, 512) < 400 ? 5 : 6);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/baejeong.json").then((r) => r.json()),
      fetch("/data/kanji_master.json").then((r) => r.json()),
      fetch("/data/kanji_diff_full.json").then((r) => r.json()),
    ])
      .then(([b, m, d]: [Row[], { kanji: Kanji[] }, { kanji: { krTraditional: string; jpShinjitai: string }[] }]) => {
        if (!alive) return;
        const master = new Map<string, Kanji>();
        m.kanji.forEach((k) => master.set(k.literal, k));
        const map = new Map<string, JpInfo>();
        const put = (kr: string, jp: string) => {
          const k = master.get(jp);
          if (k) map.set(kr, { jp, on: k.ja_on, kun: k.ja_kun, jlpt: k.jlpt_level, stroke: k.stroke_count });
        };
        master.forEach((_, lit) => put(lit, lit));
        d.kanji.forEach((x) => put(x.krTraditional, x.jpShinjitai)); // 한국 정자 → 일본 신자체
        setJpMap(map);
        setRows(b.slice().sort((x, y) => gradeRank(x[2]) - gradeRank(y[2])));
        setLoading(false);
      })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    rows.forEach((r) => {
      const l = GRADE_LABEL[r[2]];
      c[l] = (c[l] ?? 0) + 1;
    });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows.filter((r) => {
      if (grade !== "all" && GRADE_LABEL[r[2]] !== grade) return false;
      if (!q) return true;
      return r[0] === q || r[0].includes(q) || r[1].includes(q) || r[3].includes(q);
    });
  }, [rows, grade, query]);

  const rowCount = Math.ceil(filtered.length / columns);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 78, []),
    overscan: 6,
  });

  const toggle = (ch: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(ch)) n.delete(ch); else n.add(ch);
      return n;
    });

  const onCard = (r: Row) => (selectMode ? toggle(r[0]) : setDetail(r));
  const detailJp = detail ? jpMap.get(detail[0]) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-gray-50 dark:bg-gray-900 w-full sm:max-w-lg h-[95vh] sm:h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              <span className="text-emerald-600 dark:text-emerald-400">配定</span> 한국어문회 배정한자
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {loading ? "로딩 중..." : `${filtered.length.toLocaleString()}자 / ${rows.length.toLocaleString()}자`}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">×</button>
        </div>

        {/* 검색 + 급수 필터 */}
        <div className="px-4 py-3 space-y-2 bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="한자, 음, 훈 검색 (예: 학, 배울, 學)"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {["all", ...GRADE_ORDER].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-all",
                  grade === g
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                )}
              >
                {g === "all" ? "전체" : g}
                <span className="ml-1 text-xs opacity-80">{counts[g] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button
              onClick={() => setSelectMode((v) => !v)}
              className={clsx("px-3 py-1 rounded-lg border", selectMode
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300")}
            >
              {selectMode ? "선택 모드 끄기" : "👆 선택"}
            </button>
            {selectMode && (
              <>
                <span className="text-gray-600 dark:text-gray-300"><b>{selected.size}</b>자 선택</span>
                <button className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                  onClick={() => setSelected(new Set(filtered.map((r) => r[0])))}>현재 목록 전체</button>
                <button className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600"
                  onClick={() => setSelected(new Set())}>해제</button>
                <button className="px-2 py-1 rounded bg-slate-700 text-white disabled:opacity-40"
                  disabled={selected.size === 0}
                  onClick={() => setPrintChars(Array.from(selected))}>🖨️ 한자책 출력</button>
              </>
            )}
          </div>
        </div>

        {/* 목록 */}
        <div ref={parentRef} className="flex-1 min-h-0 overflow-auto px-3 py-2" style={{ contain: "strict" }}>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">검색 결과가 없습니다.</div>
          ) : (
            <div style={{ height: `${virtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
              {virtualizer.getVirtualItems().map((vr) => {
                const items = filtered.slice(vr.index * columns, vr.index * columns + columns);
                return (
                  <div
                    key={vr.key}
                    className="grid gap-1.5"
                    style={{
                      position: "absolute", top: 0, left: 0, width: "100%", height: `${vr.size}px`,
                      transform: `translateY(${vr.start}px)`,
                      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    }}
                  >
                    {items.map((r) => {
                      const sel = selected.has(r[0]);
                      return (
                        <button
                          key={r[0]}
                          onClick={() => onCard(r)}
                          className={clsx(
                            "relative flex flex-col items-center justify-center aspect-square rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                            sel && "ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-900/40"
                          )}
                        >
                          <span className="absolute top-0.5 right-0.5 px-1 text-[9px] font-bold text-white rounded bg-emerald-600">
                            {GRADE_LABEL[r[2]]}
                          </span>
                          <span className="text-2xl font-bold text-gray-900 dark:text-white" lang="ko" style={{ fontFamily: "'Noto Serif KR', serif" }}>{r[0]}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-full px-1">{r[3].replace(/\(.*?\)/g, "").split(" | ")[0]}</span>
                          {selectMode && (
                            <span className={clsx("absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full text-[10px] leading-4 text-center font-bold",
                              sel ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-600 text-transparent")}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 상세 */}
        {detail && (
          <div className="absolute inset-0 z-10 flex items-end sm:items-center justify-center bg-black/40" onClick={() => setDetail(null)}>
            <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 space-y-3 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div className="text-7xl font-bold text-gray-900 dark:text-white" lang="ko" style={{ fontFamily: "'Noto Serif KR', serif" }}>{detail[0]}</div>
                <button onClick={() => setDetail(null)} className="text-2xl leading-none text-gray-400">×</button>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{detail[3].replace(/ \| /g, " · ")}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  대표음 {detail[1]} · {GRADE_LABEL[detail[2]]}{detail[2] === "12" ? "(읽기 범위)" : ""}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-700 py-2"><div className="text-xs text-gray-500">부수</div><div className="text-lg" lang="ko">{detail[4]}</div></div>
                <div className="rounded-lg bg-gray-100 dark:bg-gray-700 py-2"><div className="text-xs text-gray-500">부수 외 획</div><div className="text-lg">{detail[5]}</div></div>
                <div className="rounded-lg bg-gray-100 dark:bg-gray-700 py-2"><div className="text-xs text-gray-500">총획</div><div className="text-lg">{detail[6]}</div></div>
              </div>
              {detailJp ? (
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-3 text-sm">
                  <div className="font-bold text-red-700 dark:text-red-300 mb-1">
                    일본 상용한자 <span lang="ja" style={{ fontFamily: "'Noto Serif JP', serif" }} className="text-xl">{detailJp.jp}</span>
                    {detailJp.jp !== detail[0] && <span className="ml-1 text-xs font-normal">(한국 정자와 자형이 다름)</span>}
                  </div>
                  <div>音 {detailJp.on.join(", ") || "-"}</div>
                  <div>訓 {detailJp.kun.join(", ") || "-"}</div>
                  <div className="text-xs text-gray-500 mt-1">{detailJp.stroke}획 · JLPT {detailJp.jlpt}</div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-100 dark:bg-gray-700 p-3 text-sm text-gray-600 dark:text-gray-300">일본 상용한자(2,136자)에 없는 글자입니다.</div>
              )}
              {detailJp && (
                <button className="w-full py-2 rounded-lg bg-slate-700 text-white text-sm"
                  onClick={() => setPrintChars([detail[0]])}>🖨️ 이 한자 한자책 출력</button>
              )}
            </div>
          </div>
        )}
      </div>

      {printChars && (
        <HanjaBookPrintModal
          chars={printChars}
          title={`한자책 출력(양면) · 배정한자 ${printChars.length}자`}
          onClose={() => setPrintChars(null)}
        />
      )}
    </div>
  );
}
