"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface PrintEntry {
  kanji: string;
  jeongja: string | null;
  sound: string;
  meaning: string;
}

const BLOCK_SIZE = 200; // 한 블록(출력 묶음)의 글자 수

// 한 페이지당 글자 수 -> 열 수, 글자 크기
const LAYOUTS: Record<number, { cols: number; rows: number; font: number }> = {
  20: { cols: 4, rows: 5, font: 60 },
  24: { cols: 6, rows: 4, font: 52 },
  30: { cols: 5, rows: 6, font: 46 },
};

export default function KanjiPrintPage() {
  const [entries, setEntries] = useState<PrintEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [perPage, setPerPage] = useState<20 | 24 | 30>(20);
  const [block, setBlock] = useState<string>("all");

  useEffect(() => {
    fetch("/data/kanji_sound_order.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: PrintEntry[]) => setEntries(data))
      .catch((e: Error) => setError(e.message));
  }, []);

  // 200자 단위 블록 (발음순 유지)
  const blocks = useMemo(() => {
    const out: { no: number; from: number; items: PrintEntry[] }[] = [];
    for (let i = 0; i < entries.length; i += BLOCK_SIZE) {
      out.push({
        no: out.length + 1,
        from: i + 1,
        items: entries.slice(i, i + BLOCK_SIZE),
      });
    }
    return out;
  }, [entries]);

  const selected = block === "all" ? blocks : blocks.filter((b) => String(b.no) === block);
  const layout = LAYOUTS[perPage];

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { background: #fff; }
          .print-page { break-after: page; }
          .print-page:last-child { break-after: auto; }
        }
      `}</style>

      <div className="print:hidden mx-auto max-w-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">상용한자 큰 글씨 인쇄</h1>
          <Link href="/learn/kanji-sound" className="text-sm text-blue-600 hover:underline">
            발음순 목록으로
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 rounded border p-4">
          <label className="flex items-center gap-2 text-sm">
            한 페이지
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value) as 20 | 24 | 30)}
              className="rounded border px-2 py-1"
            >
              <option value={20}>20자</option>
              <option value={24}>24자</option>
              <option value={30}>30자</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            블록(200자씩)
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="rounded border px-2 py-1"
            >
              <option value="all">전체</option>
              {blocks.map((b) => (
                <option key={b.no} value={String(b.no)}>
                  {b.no}번 ({b.from}~{b.from + b.items.length - 1})
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={entries.length === 0}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
          >
            인쇄
          </button>
        </div>

        {error && <p className="text-red-600">데이터를 불러오지 못했습니다: {error}</p>}
        {!error && entries.length === 0 && <p className="text-gray-500">불러오는 중…</p>}
        <p className="text-sm text-gray-500">
          총 {entries.length}자 · 블록 {blocks.length}개 · 선택한 범위 {selected.reduce((n, b) => n + b.items.length, 0)}자
        </p>
      </div>

      {/* 인쇄 영역 */}
      <div>
        {selected.map((b) => {
          const pages: PrintEntry[][] = [];
          for (let i = 0; i < b.items.length; i += perPage) pages.push(b.items.slice(i, i + perPage));
          return pages.map((page, pi) => (
            <section
              key={`${b.no}-${pi}`}
              className="print-page mx-auto bg-white text-black"
              style={{
                width: "194mm",
                height: "281mm",
                padding: "2mm",
                display: "grid",
                gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
                gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
                gap: "1mm",
              }}
            >
              {page.map((e) => (
                <div
                  key={e.kanji + e.sound + e.meaning}
                  className="flex flex-col items-center justify-center border border-gray-400 p-1"
                >
                  <div className="font-bold leading-none" style={{ fontSize: `${layout.font}pt` }}>
                    {e.kanji}
                  </div>
                  {e.jeongja && (
                    <div className="font-bold text-red-600" style={{ fontSize: `${layout.font * 0.5}pt` }}>
                      {e.jeongja}
                    </div>
                  )}
                  <div className="mt-1 text-center text-[11px] leading-4">
                    {e.meaning} {e.sound}
                  </div>
                </div>
              ))}
            </section>
          ));
        })}
      </div>
    </>
  );
}
