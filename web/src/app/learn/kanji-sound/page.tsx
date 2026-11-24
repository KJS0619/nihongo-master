"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface SoundEntry {
  row: string;
  kanji: string;
  jeongja: string | null;
  on: string;
  kun: string;
  sound: string;
  meaning: string;
  rule: string | null;
  source: string | null;
  examples: string[];
  examples_ko?: string[];
  sentence?: { ja: string; ko: string } | null;
}

// 콤보박스 항목: 히라가나 행 이름 -> 음독 가타카나 시작 글자
const KANA_OPTIONS: { label: string; kata: string }[] = [
  ..."あいうえお".split("").map((c, i) => ({ label: c, kata: "アイウエオ"[i] })),
  ..."かきくけこ".split("").map((c, i) => ({ label: c, kata: "カキクケコ"[i] })),
  ..."さしすせそ".split("").map((c, i) => ({ label: c, kata: "サシスセソ"[i] })),
  ..."たちつてと".split("").map((c, i) => ({ label: c, kata: "タチツテト"[i] })),
  ..."なにぬねの".split("").map((c, i) => ({ label: c, kata: "ナニヌネノ"[i] })),
  ..."はひふへほ".split("").map((c, i) => ({ label: c, kata: "ハヒフヘホ"[i] })),
  ..."まみむめも".split("").map((c, i) => ({ label: c, kata: "マミムメモ"[i] })),
  ..."やゆよ".split("").map((c, i) => ({ label: c, kata: "ヤユヨ"[i] })),
  ..."らりるれろ".split("").map((c, i) => ({ label: c, kata: "ラリルレロ"[i] })),
  ..."わ".split("").map((c) => ({ label: c, kata: "ワ" })),
];
const KUN_ONLY_LABEL = "훈만 가진 한자";

// 발음순(五十音) 행 구분: 음독의 첫 가나로 행을 정합니다.
function rowOf(on: string): string {
  const first = on.charAt(0);
  const map: Record<string, string> = {
    ア: "ア행", イ: "ア행", ウ: "ア행", エ: "ア행", オ: "ア행",
    カ: "カ행", キ: "カ행", ク: "カ행", ケ: "カ행", コ: "カ행",
    サ: "サ행", シ: "サ행", ス: "サ행", セ: "サ행", ソ: "サ행",
    タ: "タ행", チ: "タ행", ツ: "タ행", テ: "タ행", ト: "タ행",
    ナ: "ナ행", ニ: "ナ행", ヌ: "ナ행", ネ: "ナ행", ノ: "ナ행",
    ハ: "ハ행", ヒ: "ハ행", フ: "ハ행", ヘ: "ハ행", ホ: "ハ행",
    マ: "マ행", ミ: "マ행", ム: "マ행", メ: "マ행", モ: "マ행",
    ヤ: "ヤ행", ユ: "ヤ행", ヨ: "ヤ행",
    ラ: "ラ행", リ: "ラ행", ル: "ラ행", レ: "ラ행", ロ: "ラ행",
    ワ: "ワ행", ヲ: "ワ행", ン: "ワ행",
  };
  return map[first] ?? "기타";
}

export default function KanjiSoundOrderPage() {
  const [entries, setEntries] = useState<SoundEntry[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/kanji_sound_order.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: SoundEntry[]) => setEntries(data))
      .catch((e: Error) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return entries;
    // 콤보 항목(あ, か … 또는 훈만 가진 한자)과 정확히 같으면 행 필터
    if (q === KUN_ONLY_LABEL) {
      return entries.filter((e) => !e.on || e.on === "—");
    }
    const opt = KANA_OPTIONS.find((o) => o.label === q);
    if (opt) {
      return entries.filter((e) => e.on.startsWith(opt.kata));
    }
    // 그 밖의 입력은 자유 검색
    return entries.filter(
      (e) =>
        e.kanji.includes(q) ||
        (e.jeongja ?? "").includes(q) ||
        e.on.includes(q) ||
        e.sound.includes(q) ||
        e.meaning.split(/[\s,·()]+/).includes(q)
    );
  }, [entries, query]);

  // 행별로 묶기 (발음순 유지)
  const groups = useMemo(() => {
    const out: { row: string; items: SoundEntry[] }[] = [];
    for (const e of filtered) {
      const row = rowOf(e.on);
      const last = out[out.length - 1];
      if (last && last.row === row) last.items.push(e);
      else out.push({ row, items: [e] });
    }
    return out;
  }, [filtered]);

  // 인쇄용: PPT와 같이 한 페이지에 5자씩 세로 카드 5줄
  const printPages = useMemo(() => {
    const pages: SoundEntry[][] = [];
    for (let i = 0; i < filtered.length; i += 5) pages.push(filtered.slice(i, i + 5));
    return pages;
  }, [filtered]);

  return (
    <>
    <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } body { background: #fff; } }`}</style>
    <main className="mx-auto max-w-6xl p-6 print:hidden">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">한자 발음순</h1>
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-700"
          >
            인쇄
          </button>
          <Link href="/learn/kanji-print" className="text-sm text-blue-600 hover:underline">
            큰 글씨 인쇄
          </Link>
          <Link href="/learn" className="text-sm text-blue-600 hover:underline">
            학습 메뉴로
          </Link>
        </div>
      </div>

      <input
        type="search"
        list="kana-options"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="행 선택(あ, か … 훈만 가진 한자) 또는 한자·음·뜻 직접 검색"
        className="mb-4 w-full rounded border px-3 py-2 print:hidden"
      />
      <datalist id="kana-options">
        {KANA_OPTIONS.map((o) => (
          <option key={o.label} value={o.label}>
            {`${o.label} (${o.kata})`}
          </option>
        ))}
        <option value={KUN_ONLY_LABEL} />
      </datalist>

      {error && (
        <p className="text-red-600">데이터를 불러오지 못했습니다: {error}</p>
      )}
      {!error && entries.length === 0 && <p className="text-gray-500">불러오는 중…</p>}
      <p className="mb-4 text-sm text-gray-500">{filtered.length}자</p>

      {groups.map((g) => (
        <section key={g.row + g.items[0].kanji} className="mb-8">
          <h2 className="mb-3 border-b pb-1 text-lg font-semibold">{g.row}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {g.items.map((e) => (
              <article key={e.kanji + e.on} className="break-inside-avoid rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold">{e.kanji}</div>
                    {e.jeongja && (
                      <div className="mt-1 text-2xl font-bold text-red-600">
                        {e.jeongja}
                      </div>
                    )}
                  </div>
                  <div className="text-sm leading-6">
                    <div>
                      음독 <span className="font-semibold">{e.on}</span>
                    </div>
                    <div>훈독 {e.kun}</div>
                    <div>
                      뜻·음 {e.meaning} {e.sound}
                    </div>
                    {e.rule && (
                      <div className="font-semibold text-blue-700">규칙 {e.rule}</div>
                    )}
                    {e.source && (
                      <div className="text-green-700">{e.source}</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 border-t pt-2 text-sm">
                  <div className="mb-1 font-semibold text-gray-600">예문·단어</div>
                  {e.examples.map((ex, i) => (
                    <div key={ex}>
                      {ex}
                      {e.examples_ko?.[i] ? (
                        <span className="ml-2 text-gray-600">{e.examples_ko[i]}</span>
                      ) : null}
                    </div>
                  ))}
                  {e.sentence && (
                    <div className="mt-2">
                      <div>{e.sentence.ja}</div>
                      <div className="text-gray-500">{e.sentence.ko}</div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>

    {/* 인쇄 전용: 한 페이지에 5자, 가로 A4에 세로 카드 5개 */}
    <div className="hidden print:block">
      {printPages.map((page, pi) => (
        <section
          key={pi}
          className="grid grid-cols-5 gap-3 break-after-page"
          style={{ height: "188mm" }}
        >
          {page.map((e) => (
            <div
              key={e.kanji + e.on}
              className="flex flex-col items-center border border-gray-400 p-2 text-black"
              style={{ height: "188mm" }}
            >
              <div className="text-6xl font-bold leading-none">{e.kanji}</div>
              {e.jeongja && (
                <div className="mt-1 text-3xl font-bold text-red-600">{e.jeongja}</div>
              )}
              <div className="mt-2 w-full text-left text-[11px] leading-5">
                <div>음독 {e.on}</div>
                <div>훈독 {e.kun}</div>
                <div>뜻·음 {e.meaning} {e.sound}</div>
                {e.rule && <div className="font-semibold text-blue-700">규칙 {e.rule}</div>}
                {e.source && <div className="text-green-700">{e.source}</div>}
                <div className="mt-1 font-semibold text-gray-600">예문·단어</div>
                {e.examples.map((ex, i) => (
                  <div key={ex}>
                    {ex} <span className="text-gray-600">{e.examples_ko?.[i] ?? ""}</span>
                  </div>
                ))}
                {e.sentence && (
                  <div className="mt-1">
                    <div>{e.sentence.ja}</div>
                    <div className="text-gray-500">{e.sentence.ko}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
    </>
  );
}
