"""한자 검색 모듈 + 명령줄 도구.

입력 예:
    아          -> 한국 음이 '아'이거나 일본 음독이 '아~'(ア…)로 시작하는 한자
    あ / ア     -> 일본 음독이 あ/ア 로 시작하는 한자
    아이        -> 음독이 '아이'(アイ)로 시작하는 한자

다른 앱에서 쓰기:
    from kanji_search import search
    results = search("아")          # list[dict]
    # 각 dict: row, kanji, jeongja, on, kun, sound, meaning, rule, examples, reason

명령줄:
    python kanji_search.py 아
    python kanji_search.py 아 --json
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DATA = os.path.join(HERE, "kanji_data.json")

# 가타카나 -> 한글 표기 (촉음 ッ, 장음 ー 는 무시)
KANA_TO_HANGUL = {
    "ア": "아", "イ": "이", "ウ": "우", "エ": "에", "オ": "오",
    "カ": "카", "キ": "키", "ク": "쿠", "ケ": "케", "コ": "코",
    "サ": "사", "シ": "시", "ス": "스", "セ": "세", "ソ": "소",
    "タ": "타", "チ": "치", "ツ": "츠", "テ": "테", "ト": "토",
    "ナ": "나", "ニ": "니", "ヌ": "누", "ネ": "네", "ノ": "노",
    "ハ": "하", "ヒ": "히", "フ": "후", "ヘ": "헤", "ホ": "호",
    "マ": "마", "ミ": "미", "ム": "무", "メ": "메", "モ": "모",
    "ヤ": "야", "ユ": "유", "ヨ": "요",
    "ラ": "라", "リ": "리", "ル": "루", "レ": "레", "ロ": "로",
    "ワ": "와", "ヲ": "오", "ン": "응",
    "ガ": "가", "ギ": "기", "グ": "구", "ゲ": "게", "ゴ": "고",
    "ザ": "자", "ジ": "지", "ズ": "즈", "ゼ": "제", "ゾ": "조",
    "ダ": "다", "ヂ": "지", "ヅ": "즈", "デ": "데", "ド": "도",
    "バ": "바", "ビ": "비", "ブ": "부", "ベ": "베", "ボ": "보",
    "パ": "파", "ピ": "피", "プ": "푸", "ペ": "페", "ポ": "포",
}


def to_katakana(text):
    """히라가나를 가타카나로 바꿉니다(가타카나는 그대로)."""
    out = []
    for ch in text:
        code = ord(ch)
        if 0x3041 <= code <= 0x3096:       # ぁ..ゖ -> ァ..ヶ
            out.append(chr(code + 0x60))
        else:
            out.append(ch)
    return "".join(out)


def on_to_hangul(on):
    """음독(가타카나)을 한글 표기로 바꿉니다. 예: アイ -> 아이, コウ -> 코우"""
    return "".join(KANA_TO_HANGUL.get(ch, "") for ch in on)


# 五十音 순서 (발음순 정렬용). 음독의 첫 가나 기준.
GOJUON = list("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン")


def _reading_key(e):
    on = e["on"]
    first = on[0] if on else ""
    rank = GOJUON.index(first) if first in GOJUON else len(GOJUON)
    return (rank, on, e["kanji"])


def sort_by_reading(entries):
    """일본어 발음순(五十音 순서)으로 정렬한 새 리스트를 돌려줍니다."""
    return sorted(entries, key=_reading_key)


def export_sorted(data_path=DEFAULT_DATA, out_path=None):
    """발음순으로 정렬된 JSON을 저장합니다 (다른 앱에서 바로 읽을 수 있음)."""
    entries = sort_by_reading(load(data_path))
    for e in entries:
        e.pop("on_hangul", None)
    out_path = out_path or os.path.join(HERE, "kanji_sound_order.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    return out_path, len(entries)


def _is_hangul(text):
    return bool(text) and all("가" <= ch <= "힣" for ch in text)


def _is_kana(text):
    return bool(text) and all(
        "぀" <= ch <= "ヿ" or ch in "ー" for ch in text
    )


def load(path=DEFAULT_DATA):
    with open(path, encoding="utf-8") as f:
        entries = json.load(f)
    for e in entries:
        e["on_hangul"] = on_to_hangul(e["on"])
    return entries


def search(query, data_path=DEFAULT_DATA, entries=None):
    """query 에 맞는 한자 목록을 돌려줍니다."""
    q = (query or "").strip()
    if not q:
        return []
    if entries is None:
        entries = load(data_path)

    results = []
    if _is_hangul(q):
        for e in entries:
            if e["sound"] == q:
                results.append(dict(e, reason=f"한국 음 {q}"))
            elif e["on_hangul"].startswith(q):
                results.append(dict(e, reason=f"일본 음 {e['on_hangul']}"))
    elif _is_kana(q):
        kata = to_katakana(q)
        for e in entries:
            if e["on"].startswith(kata):
                results.append(dict(e, reason=f"일본 음 {e['on']}"))
    else:
        # 그 밖의 입력(예: 한자 자체)은 한자와 정자 일치 검색
        for e in entries:
            if q in (e["kanji"], e.get("jeongja")):
                results.append(dict(e, reason="한자 일치"))
    for r in results:
        r.pop("on_hangul", None)
    return results


def format_result(r):
    lines = [f"{r['kanji']}"]
    if r.get("jeongja"):
        lines.append(f"  한국 정자: {r['jeongja']}")
    lines.append(f"  음독: {r['on']}   훈독: {r['kun']}")
    lines.append(f"  뜻·음: {r['meaning']} {r['sound']}")
    if r.get("rule"):
        lines.append(f"  규칙: {r['rule']}")
    lines.append(f"  예문·단어: {' / '.join(r['examples'])}")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description="한자 음으로 검색")
    ap.add_argument("query", nargs="?", help="예: 아, あ, アイ")
    ap.add_argument("--data", default=DEFAULT_DATA)
    ap.add_argument("--json", action="store_true", help="JSON으로 출력")
    ap.add_argument("--export-sorted", action="store_true",
                    help="발음순 JSON 파일(kanji_sound_order.json)을 만들고 종료")
    args = ap.parse_args()

    if args.export_sorted:
        out, n = export_sorted(args.data)
        print(f"saved {out} ({n} entries, 발음순)")
        return

    results = search(args.query, args.data)
    if args.json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return
    if not results:
        print(f"'{args.query}' 에 해당하는 한자가 없습니다.")
        return
    print(f"'{args.query}' 검색 결과 {len(results)}자\n")
    for r in results:
        print(format_result(r))
        print()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
