"""web/public/data/kanji_master.json (프로젝트 기존 데이터, 2,136자)에서
kanji_data.json에 없는 글자를 가져와 추가합니다.

- 음독(ja_on)·훈독(ja_kun)·한국 훈음(korean_hun_eum)을 사용
- 예문(examples)과 예문 문장(sentence)은 비워 둡니다 (나중에 직접 작성)
- 상용1/2 쪽수는 원본 상용한자 파일에서 가져옵니다.
- 이미 있는 글자는 건너뜁니다.

사용법 (프로젝트 루트에서): python kanji_rows/import_master.py
"""
import ast
import collections
import json
import os

ROOT = r"D:\vercel-projects\nihongo-master"
MASTER = os.path.join(ROOT, "web", "public", "data", "kanji_master.json")
DATA = os.path.join(ROOT, "kanji_data.json")
SRC = r"C:\Users\user\Downloads\sangyong_hanja_1_2_all (2).json"

RULES = {
    "애": "애 → アイ(아이)", "개": "개 → カイ(카이)", "가": "가 → カ(카)",
    "감": "감 → カン(칸)", "영": "영 → エイ(에이)", "왕": "왕 → オウ(오우)",
    "일": "일 → イチ/イツ(이치/이츠)", "인": "인 → イン(인)", "열": "열 → エツ(에츠)",
    "연": "연 → エン(엔)", "화": "화 → カ(카)", "한": "한 → カン(칸)",
    "기": "기 → キ(키)",
}
LABEL = {"상용한자1": "상용1", "상용한자2": "상용2"}
ROW_OF = {}
for _row, _chars in {
    "あ行": "アイウエオ", "か行": "カキクケコ", "さ行": "サシスセソ", "た行": "タチツテト",
    "な行": "ナニヌネノ", "は行": "ハヒフヘホ", "ま行": "マミムメモ", "や行": "ヤユヨ",
    "ら行": "ラリルレロ", "わ行": "ワヲン",
}.items():
    for _c in _chars:
        ROW_OF[_c] = _row


def first_item(text):
    """'["ニチ", "ジツ"]' 같은 문자열에서 첫 항목을 꺼냅니다. 없으면 ''."""
    try:
        val = ast.literal_eval(text) if isinstance(text, str) else text
    except (ValueError, SyntaxError):
        return ""
    if isinstance(val, list):
        return val[0] if val else ""
    return str(val) if val else ""


def clean_kun(text):
    k = first_item(text)
    return k.replace("-", "").replace(".", "").strip()


def main():
    master = json.load(open(MASTER, encoding="utf-8"))["kanji"]
    entries = json.load(open(DATA, encoding="utf-8"))
    existing = {e["kanji"] for e in entries}

    src = json.load(open(SRC, encoding="utf-8"))
    by = collections.defaultdict(list)
    for x in src:
        by[x["kanji"]].append(x)

    added = 0
    for m in master:
        kanji = m["literal"]
        if kanji in existing:
            continue
        on = first_item(m.get("ja_on"))
        kun = clean_kun(m.get("ja_kun")) or "—"
        hun = (m.get("korean_hun_eum") or "").split(",")[0].strip()
        parts = hun.split()
        if len(parts) >= 2:
            sound = parts[-1]
            meaning = hun[: -len(sound)].strip()
        else:
            sound, meaning = "", hun
        if not on:
            on = "—"
            row = "훈만 가진 한자"
        else:
            row = ROW_OF.get(on[0], "기타")
        source = " / ".join(f"{LABEL.get(x['category'], x['category'])} p.{x['page']}" for x in by.get(kanji, [])) or None
        entries.append({
            "row": row, "kanji": kanji, "jeongja": None, "on": on, "kun": kun,
            "sound": sound, "meaning": meaning, "rule": RULES.get(sound), "source": source,
            "examples": [], "examples_ko": [], "sentence": None,
        })
        existing.add(kanji)
        added += 1

    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    print("added", added, "total", len(entries))
    print("rows", dict(collections.Counter(e["row"] for e in entries)))


if __name__ == "__main__":
    main()
