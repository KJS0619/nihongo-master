"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { Kanji } from "@/types/kanji";

/** public/data/hanja_book.json 구조 */
interface PairData {
  jp: string; hun: string; g: string; rad: number; o: number;
  sk: number | null; sj: number | null;
  on: string[]; kun: string[]; kunMore: boolean;
  parts: string; what: string; why: string; tip: string;
  ks: string[]; kk: "mm" | "kvg"; kn: string;
}
interface SameData {
  hun: string; g: string; jl: string; rad: number; no: number; sc: number;
  why: string; chk: boolean; on: string[]; kun: string[]; kunMore: boolean;
}
interface BookData {
  pairs: Record<string, PairData>;
  same: Record<string, SameData>;
  rad: Record<string, string>;
}

type PairItem = { kind: "pair"; key: string; kr: string; d: PairData };
type SameItem = { kind: "same"; key: string; ch: string; d: SameData };
type Sheet =
  | { kind: "pair"; items: PairItem[] }
  | { kind: "same"; items: SameItem[] };

const PAIR_PER_SHEET = 4;
const SAME_PER_SHEET = 5;

/** «파랑(한국)» ‹빨강(일본)› 마크업 렌더링 */
function Mk({ text }: { text: string }) {
  const parts = text.split(/(«[^»]*»|‹[^›]*›)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("«") ? (
          <b key={i} className="hb-b">{p.slice(1, -1)}</b>
        ) : p.startsWith("‹") ? (
          <b key={i} className="hb-r">{p.slice(1, -1)}</b>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/** 획수에 맞춰 칸 크기(mm) 결정: 예산 높이 안에 모두 들어가는 가장 큰 크기 */
function cellSize(counts: number[], budget: number, avail = 179): number {
  let best: number | null = null;
  for (let p = 4; p < 40; p++) {
    const ss = Math.min(16.5, avail / p - 0.3);
    const rows = counts.reduce((a, n) => a + Math.ceil(Math.max(n, 1) / p), 0);
    if (rows * (ss + 0.3) <= budget && (best === null || ss > best)) best = ss;
  }
  return best ?? 5.5;
}

function StrokeCells({
  strokes, kind, color, size,
}: { strokes: string[]; kind: "mm" | "kvg"; color: string; size: number }) {
  return (
    <div className="hb-row">
      {strokes.map((_, i) => (
        <div key={i} className="hb-c" style={{ width: `${size}mm`, height: `${size}mm` }}>
          <span className="hb-n">{i + 1}</span>
          {kind === "mm" ? (
            <svg viewBox="0 0 1024 1024" width="100%" height="100%">
              <g transform="scale(1,-1) translate(0,-900)">
                {strokes.slice(0, i + 1).map((p, k) => (
                  <path key={k} d={p} fill={k === i ? color : "#222"} />
                ))}
              </g>
            </svg>
          ) : (
            <svg viewBox="0 0 109 109" width="100%" height="100%">
              {strokes.slice(0, i + 1).map((p, k) => (
                <path key={k} d={p} fill="none" stroke={k === i ? color : "#222"}
                  strokeWidth={k === i ? 4.2 : 3.4} strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

const PAIR_CUTS = [12.4, 77.4, 142.4, 207.4, 272.2];
const SAME_CUTS = [0, 1, 2, 3, 4, 5].map((k) => 14 + k * 52.5 - 1.5);
const Cuts = ({ tops }: { tops: number[] }) => (
  <>
    {tops.map((t, i) => (
      <div key={i} className="hb-cut" style={{ top: `${t.toFixed(1)}mm` }}><span>&#9986;</span></div>
    ))}
  </>
);

function SheetPages({
  sheet, book, jpStrokes, sheetNo,
}: {
  sheet: Sheet; book: BookData; jpStrokes: Map<string, string[]>; sheetNo: number;
}) {
  const radName = (r: number) => book.rad[String(r)] ?? String(r);

  if (sheet.kind === "pair") {
    const sub = `파랑=한국 한자 · 빨강=일본 한자 · 번호는 부수순 · ${sheetNo}장`;
    return (
      <>
        <div className="hb-page">
          <div className="hb-hdr"><h1>한국 한자 → 일본 상용한자 · 앞면</h1><div className="hb-sub">{sub}</div></div>
          {sheet.items.map((it) => {
            const d = it.d;
            const kun = d.kun.join(", ") + (d.kunMore ? " …" : "");
            const stroke = d.sk && d.sj ? `획수 ${d.sk}획 → ${d.sj}획` : "";
            return (
              <div className="hb-slot hb-pslot" key={it.key}>
                <div className="hb-box">
                  <div className="hb-L">
                    <span className="hb-no">{d.o} · 부수 {radName(d.rad)}</span>
                    <div className="hb-pair">
                      <span className="hb-kr" lang="ko">{it.kr}</span>
                      <span className="hb-arr">→</span>
                      <span className="hb-jp" lang="ja">{d.jp}</span>
                    </div>
                    <div className="hb-read">
                      <div><b className="hb-b">한국</b> {d.hun}{d.g && <span className="hb-gr">{d.g}</span>}</div>
                      <div><b className="hb-r">일본</b> 音 {d.on.join(", ") || "-"} / 訓 {kun || "-"}</div>
                    </div>
                  </div>
                  <div className="hb-R">
                    {stroke && <div className="hb-st">{stroke}</div>}
                    {d.parts && <div className="hb-parts" lang="ja"><Mk text={d.parts} /></div>}
                    <div className="hb-what"><Mk text={d.what || "글자 모양의 일부가 바뀌었습니다."} /></div>
                    {d.why && <div className="hb-why"><span className="hb-wl">왜 이렇게 생겼나</span> <Mk text={d.why} /></div>}
                    {d.tip && <div className="hb-tip">암기 팁 · <Mk text={d.tip} /></div>}
                  </div>
                </div>
              </div>
            );
          })}
          <Cuts tops={PAIR_CUTS} />
        </div>
        <div className="hb-page">
          <div className="hb-hdr"><h1>쓰는 순서 · 뒷면</h1>
            <div className="hb-sub">박스 순서는 앞면과 같습니다. 칸 = 1획 · 지금 쓰는 획만 색(파랑 한국/빨강 일본) · 검정=앞서 쓴 획 · {sheetNo}장</div></div>
          {sheet.items.map((it) => {
            const d = it.d;
            const js = jpStrokes.get(d.jp) ?? [];
            const size = cellSize([d.ks.length, js.length], 37);
            return (
              <div className="hb-slot hb-pslot" key={it.key}>
                <div className="hb-bb hb-pbb">
                  <div className="hb-hd">
                    <span className="hb-no2">{d.o}</span>
                    <b className="hb-k" lang="ko">{it.kr}</b> → <b className="hb-j" lang="ja">{d.jp}</b>
                    &nbsp; {d.hun}{d.g && <span className="hb-gr">{d.g}</span>}
                  </div>
                  <div className="hb-lab" style={{ color: "#2563eb" }}>
                    한국 {it.kr} · {d.ks.length}획
                    {d.kn && <span style={{ color: "#888", fontWeight: "normal" }}> ({d.kn})</span>}
                  </div>
                  <StrokeCells strokes={d.ks} kind={d.kk} color="#2563eb" size={size} />
                  <div className="hb-lab" style={{ color: "#dc2626" }}>일본 {d.jp} · {js.length}획</div>
                  <StrokeCells strokes={js} kind="kvg" color="#dc2626" size={size} />
                </div>
              </div>
            );
          })}
          <Cuts tops={PAIR_CUTS} />
        </div>
      </>
    );
  }

  const sub = `부수순(강희자전 번호 → 획수) · ${sheetNo}장`;
  return (
    <>
      <div className="hb-page">
        <div className="hb-hdr"><h1>한자 학습 · 앞면</h1><div className="hb-sub">{sub}</div></div>
        {sheet.items.map((it) => {
          const d = it.d;
          const kun = d.kun.join(", ") + (d.kunMore ? " …" : "");
          return (
            <div className="hb-slot hb-sslot" key={it.key}>
              <div className="hb-sbox">
                <div className="hb-sL">
                  <span className="hb-no">{d.no} · 부수 {radName(d.rad)}</span>
                  <div className="hb-ch" lang="ko">{it.ch}</div>
                </div>
                <div className="hb-sR">
                  <div className="hb-hun">
                    <b className="hb-b">한국</b> {d.hun}{d.g && <span className="hb-gr">{d.g}</span>}
                    {d.chk && <span className="hb-chk">검증 필요</span>}
                  </div>
                  <div className="hb-sjp"><b className="hb-r">일본</b> 音 {d.on.join(", ") || "-"} / 訓 {kun || "-"}</div>
                  <div className="hb-meta">
                    {d.sc}획 · {d.g ? `한자능력검정 ${d.g}` : "한자능력검정 급수 외"} · {d.jl ? `JLPT ${d.jl}` : "JLPT 목록 밖"}
                  </div>
                  {d.why && <div className="hb-why"><span className="hb-wl">字源</span> {d.why}</div>}
                </div>
              </div>
            </div>
          );
        })}
        <Cuts tops={SAME_CUTS} />
      </div>
      <div className="hb-page">
        <div className="hb-hdr"><h1>쓰는 순서 · 뒷면</h1><div className="hb-sub">{sub} · 박스 순서는 앞면과 같습니다. 칸 = 1획</div></div>
        {sheet.items.map((it) => {
          const d = it.d;
          const st = jpStrokes.get(it.ch) ?? [];
          const size = cellSize([st.length], 30);
          return (
            <div className="hb-slot hb-sslot" key={it.key}>
              <div className="hb-bb hb-sbb">
                <div className="hb-hd">
                  <span className="hb-no2s">{d.no} · 부수 {radName(d.rad)}</span>
                  <b className="hb-ks" lang="ko">{it.ch}</b> &nbsp; {d.hun}{d.g && <span className="hb-gr">{d.g}</span>}
                </div>
                <div className="hb-lab" style={{ color: "#1e3a8a" }}>
                  획순 · {st.length}획 <span style={{ fontWeight: "normal", color: "#666" }}>(빨강 = 지금 쓰는 획, 검정 = 앞서 쓴 획)</span>
                </div>
                <StrokeCells strokes={st} kind="kvg" color="#dc2626" size={size} />
              </div>
            </div>
          );
        })}
        <Cuts tops={SAME_CUTS} />
      </div>
    </>
  );
}

const CSS = `
#hb-print-root{display:none}
.hb-page{width:186mm;height:277mm;box-sizing:border-box;position:relative;background:#fff;color:#1f2937;
  font-family:'Noto Sans KR','Noto Sans JP',sans-serif;break-after:page;page-break-after:always;overflow:hidden;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.hb-page h1{font-size:13pt;margin:0 0 1mm;font-weight:700}
.hb-sub{font-size:8.5pt;color:#6b7280}
.hb-hdr{height:14mm;overflow:hidden}
.hb-b{color:#2563eb}.hb-r{color:#dc2626}
.hb-slot{width:187mm}
.hb-pslot{height:62mm;margin-bottom:3mm}.hb-sslot{height:49.5mm;margin-bottom:3mm}
.hb-gr{font-size:7.5pt;background:#e0e7ff;color:#3730a3;border-radius:1mm;padding:0 1.3mm;margin-left:1mm;font-weight:normal}
.hb-chk{font-size:7pt;background:#fee2e2;color:#991b1b;border-radius:1mm;padding:0 1.3mm;margin-left:1mm;font-weight:normal}
.hb-no{position:absolute;top:1.5mm;left:3mm;font-size:7pt;color:#475569;font-weight:bold}
.hb-box{display:flex;box-sizing:border-box;width:186mm;height:62mm;border:0.6pt solid #cbd5e1;border-radius:3mm;background:#fff;overflow:hidden}
.hb-L{width:76mm;flex:none;box-sizing:border-box;text-align:center;padding-top:7mm;position:relative;border-right:0.4pt dashed #cbd5e1}
.hb-pair{white-space:nowrap;line-height:1.25}
.hb-kr{font-family:'Noto Serif KR',serif;font-weight:700;font-size:58pt;color:#2563eb}
.hb-jp{font-family:'Noto Serif JP',serif;font-weight:700;font-size:58pt;color:#dc2626}
.hb-arr{font-size:24pt;color:#a8a29e;margin:0 4mm;position:relative;top:-3mm}
.hb-read{font-size:9pt;line-height:1.5;margin-top:1mm;padding:0 2mm}
.hb-R{flex:1;min-width:0;padding:3.5mm 5mm 0 5mm}
.hb-st{font-size:8pt;color:#6b7280;margin-bottom:1mm}
.hb-parts{font-family:'Noto Serif JP',serif;font-size:14pt;margin-bottom:1.5mm}
.hb-what{font-size:9.5pt;line-height:1.5;margin-bottom:1.5mm}
.hb-why{font-size:9pt;line-height:1.5;margin-bottom:1.5mm;background:#f1f5f9;border-radius:1.5mm;padding:1.2mm 2.2mm}
.hb-wl{font-weight:bold;color:#475569;margin-right:1mm}
.hb-tip{font-size:9.5pt;font-weight:bold;background:#fef9c3;border-radius:1.5mm;padding:1mm 2.5mm}
.hb-sbox{display:flex;box-sizing:border-box;width:186mm;height:49.5mm;border:0.6pt solid #cbd5e1;border-radius:3mm;background:#fff;overflow:hidden}
.hb-sL{width:50mm;flex:none;box-sizing:border-box;text-align:center;position:relative;border-right:0.4pt dashed #cbd5e1;display:flex;align-items:center;justify-content:center}
.hb-ch{font-family:'Noto Serif KR',serif;font-weight:700;font-size:60pt;color:#1e3a8a;line-height:1.1;margin-top:5mm}
.hb-sR{flex:1;min-width:0;padding:5mm 5mm 0 5mm}
.hb-hun{font-size:14pt;font-weight:bold;margin-bottom:1.5mm}
.hb-sjp{font-size:10pt;margin-bottom:1.5mm}
.hb-meta{font-size:8.5pt;color:#6b7280;margin-bottom:2mm}
.hb-bb{box-sizing:border-box;width:186mm;border:0.6pt solid #cbd5e1;border-radius:3mm;background:#fff;overflow:hidden;padding:3mm 3mm 0 3mm}
.hb-pbb{height:62mm}.hb-sbb{height:49.5mm}
.hb-hd{font-size:9pt;margin-bottom:1mm}
.hb-no2{font-size:7pt;color:#94a3b8;margin-right:3mm}.hb-no2s{font-size:8pt;color:#475569;font-weight:bold;margin-right:3mm}
.hb-k{font-family:'Noto Serif KR',serif;font-size:17pt;color:#2563eb;vertical-align:middle}
.hb-j{font-family:'Noto Serif JP',serif;font-size:17pt;color:#dc2626;vertical-align:middle}
.hb-ks{font-family:'Noto Serif KR',serif;font-size:17pt;color:#1e3a8a;vertical-align:middle}
.hb-lab{font-size:7.5pt;font-weight:bold;margin:.6mm 0 .3mm}
.hb-row{display:block;font-size:0}
.hb-c{box-sizing:border-box;display:inline-block;position:relative;border:0.2mm solid #ccc;margin:0 0.3mm 0.3mm 0;background:#fff}
.hb-n{position:absolute;left:0.6mm;top:0.2mm;font-size:5.5pt;color:#888}
.hb-cut{position:absolute;left:-12mm;width:210mm;height:0;border-top:0.35mm dashed #888}
.hb-cut span{position:absolute;left:3mm;top:-3.2mm;font-size:8pt;color:#666;background:#fff;padding:0 1mm}
@page{size:A4;margin:9mm 12mm}
@media print{
  body>*:not(#hb-print-root){display:none!important}
  #hb-print-root{display:block!important}
  #hb-print-root .hb-page:last-child{break-after:auto;page-break-after:auto}
}
`;

interface Props {
  /** 출력 대상 글자(한국 정자/일본 상용한자 아무거나 가능) */
  chars: string[];
  title?: string;
  /** true면 직접 입력/붙여넣기 칸 표시 */
  allowInput?: boolean;
  onClose: () => void;
}

export function HanjaBookPrintModal({ chars, title = "한자책 출력(양면)", allowInput = false, onClose }: Props) {
  const [book, setBook] = useState<BookData | null>(null);
  const [jpStrokes, setJpStrokes] = useState<Map<string, string[]>>(new Map());
  const [error, setError] = useState("");
  const [custom, setCustom] = useState("");
  const [usePair, setUsePair] = useState(true);
  const [useSame, setUseSame] = useState(true);
  const [chunkSize, setChunkSize] = useState(20);
  const [chunk, setChunk] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/data/hanja_book.json").then((r) => r.json()),
      fetch("/data/kanji_master.json").then((r) => r.json()),
    ])
      .then(([b, m]: [BookData, { kanji: Kanji[] }]) => {
        if (!alive) return;
        const map = new Map<string, string[]>();
        m.kanji.forEach((k) => {
          if (k.stroke_paths?.length) map.set(k.literal, k.stroke_paths.map((s) => s.path));
        });
        setJpStrokes(map);
        setBook(b);
      })
      .catch(() => alive && setError("한자 데이터를 불러오지 못했습니다."));
    return () => { alive = false; };
  }, []);

  const targetChars = useMemo(() => {
    const src = allowInput && custom.trim()
      ? Array.from(custom).filter((c) => /[㐀-鿿豈-﫿]/.test(c))
      : chars;
    return Array.from(new Set(src));
  }, [chars, custom, allowInput]);

  /** 글자 분류: 차이 한자(정자 또는 신자체 어느 쪽이든) / 같은 한자 / 목록 밖 */
  const { pairs, sames, skipped } = useMemo(() => {
    const ps = new Map<string, PairItem>();
    const ss = new Map<string, SameItem>();
    const skip: string[] = [];
    if (!book) return { pairs: [] as PairItem[], sames: [] as SameItem[], skipped: skip };
    const byJp = new Map<string, string[]>();
    Object.entries(book.pairs).forEach(([kr, d]) => {
      const a = byJp.get(d.jp) ?? [];
      a.push(kr);
      byJp.set(d.jp, a);
    });
    for (const c of targetChars) {
      if (book.pairs[c]) { ps.set(c, { kind: "pair", key: c, kr: c, d: book.pairs[c] }); continue; }
      const krs = byJp.get(c);
      if (krs) { krs.forEach((kr) => ps.set(kr, { kind: "pair", key: kr, kr, d: book.pairs[kr] })); continue; }
      if (book.same[c]) { ss.set(c, { kind: "same", key: c, ch: c, d: book.same[c] }); continue; }
      skip.push(c);
    }
    return {
      pairs: Array.from(ps.values()).sort((a, b) => a.d.o - b.d.o),
      sames: Array.from(ss.values()).sort((a, b) => a.d.no - b.d.no),
      skipped: skip,
    };
  }, [book, targetChars]);

  const sheets: Sheet[] = useMemo(() => {
    const out: Sheet[] = [];
    if (usePair) for (let i = 0; i < pairs.length; i += PAIR_PER_SHEET) out.push({ kind: "pair", items: pairs.slice(i, i + PAIR_PER_SHEET) });
    if (useSame) for (let i = 0; i < sames.length; i += SAME_PER_SHEET) out.push({ kind: "same", items: sames.slice(i, i + SAME_PER_SHEET) });
    return out;
  }, [pairs, sames, usePair, useSame]);

  const chunkCount = Math.max(1, Math.ceil(sheets.length / chunkSize));
  useEffect(() => { if (chunk >= chunkCount) setChunk(0); }, [chunk, chunkCount]);
  useEffect(() => { if (previewIdx >= sheets.length) setPreviewIdx(0); }, [previewIdx, sheets.length]);
  const chunkSheets = sheets.slice(chunk * chunkSize, (chunk + 1) * chunkSize);

  const doPrint = useCallback(() => {
    if (chunkSheets.length === 0) return;
    setPrinting(true);
  }, [chunkSheets.length]);

  // 인쇄용 DOM이 그려진 뒤 글꼴 로딩을 기다렸다가 인쇄 창 열기
  useEffect(() => {
    if (!printing) return;
    let cancelled = false;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done, { once: true });
    (async () => {
      try { await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready; } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 400));
      if (!cancelled) window.print();
    })();
    return () => { cancelled = true; window.removeEventListener("afterprint", done); };
  }, [printing]);

  const preview = sheets[previewIdx];
  const startNo = chunk * chunkSize + 1;
  const endNo = Math.min(sheets.length, (chunk + 1) * chunkSize);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2" onClick={onClose}>
      <style>{CSS}</style>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 text-2xl leading-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded">×</button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          {error && <div className="text-red-600">{error}</div>}
          {!book && !error && <div className="text-gray-500">불러오는 중…</div>}

          {allowInput && (
            <div>
              <label className="block font-medium mb-1">직접 입력(비워 두면 현재 필터 결과 {chars.length}자)</label>
              <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={2}
                placeholder="출력할 한자를 붙여넣으세요 (예: 學校 日本語 亜)"
                className="w-full border rounded-lg p-2 bg-white dark:bg-gray-900 dark:border-gray-600" />
            </div>
          )}

          {book && (
            <>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={usePair} onChange={(e) => setUsePair(e.target.checked)} />
                  한·일 차이 한자 <b>{pairs.length}</b>자 ({Math.ceil(pairs.length / PAIR_PER_SHEET)}장, 4박스)
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={useSame} onChange={(e) => setUseSame(e.target.checked)} />
                  한·일 같은 한자 <b>{sames.length}</b>자 ({Math.ceil(sames.length / SAME_PER_SHEET)}장, 5박스)
                </label>
              </div>
              {skipped.length > 0 && (
                <div className="text-xs text-gray-500">
                  목록 밖 {skipped.length}자는 제외됩니다{skipped.length <= 20 ? `: ${skipped.join(" ")}` : ""}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span>총 <b>{sheets.length}</b>장(앞·뒤 {sheets.length * 2}쪽)</span>
                <label className="flex items-center gap-1">한 번에
                  <select value={chunkSize} onChange={(e) => { setChunkSize(Number(e.target.value)); setChunk(0); }}
                    className="border rounded px-1 py-0.5 bg-white dark:bg-gray-900 dark:border-gray-600">
                    {[10, 20, 30, 50].map((n) => <option key={n} value={n}>{n}장</option>)}
                  </select>
                </label>
                {chunkCount > 1 && (
                  <label className="flex items-center gap-1">구간
                    <select value={chunk} onChange={(e) => setChunk(Number(e.target.value))}
                      className="border rounded px-1 py-0.5 bg-white dark:bg-gray-900 dark:border-gray-600">
                      {Array.from({ length: chunkCount }, (_, i) => (
                        <option key={i} value={i}>{i * chunkSize + 1}–{Math.min(sheets.length, (i + 1) * chunkSize)}장</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {preview && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">미리보기 ({previewIdx + 1}/{sheets.length}장)</span>
                    <span className="space-x-1">
                      <button className="px-2 py-0.5 border rounded disabled:opacity-40" disabled={previewIdx === 0}
                        onClick={() => setPreviewIdx(previewIdx - 1)}>◀</button>
                      <button className="px-2 py-0.5 border rounded disabled:opacity-40" disabled={previewIdx >= sheets.length - 1}
                        onClick={() => setPreviewIdx(previewIdx + 1)}>▶</button>
                    </span>
                  </div>
                  <div className="overflow-x-auto border rounded-lg bg-gray-100 dark:bg-gray-900 p-2">
                    <div style={{ zoom: 0.5, display: "flex", gap: "8mm" }}>
                      <SheetPages sheet={preview} book={book} jpStrokes={jpStrokes} sheetNo={previewIdx + 1} />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg p-3 text-xs leading-relaxed">
                인쇄 창에서 <b>용지 A4 · 배율 100% · 여백 “기본” · 양면(긴 변 넘김)</b>으로 설정하세요.
                앞면·뒷면 쪽이 번갈아 나오며, 접거나 잘라도 뒷면에 같은 글자의 획순이 오도록 맞춰져 있습니다.
                “PDF로 저장”을 고르면 파일로도 받을 수 있습니다.
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border dark:border-gray-600">닫기</button>
          <button onClick={doPrint} disabled={!book || chunkSheets.length === 0 || printing}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-40">
            {printing ? "준비 중…" : `인쇄 (${startNo}–${endNo}장)`}
          </button>
        </div>
      </div>

      {mounted && printing && book &&
        createPortal(
          <div id="hb-print-root">
            {chunkSheets.map((s, i) => (
              <SheetPages key={i} sheet={s} book={book} jpStrokes={jpStrokes} sheetNo={chunk * chunkSize + i + 1} />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
