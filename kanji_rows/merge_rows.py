"""행 데이터 파일을 kanji_data.json에 병합합니다.

사용법 (프로젝트 루트에서):
    python kanji_rows/merge_rows.py rows_ke_ko KE_KO_ROW
    python kanji_rows/merge_rows.py rows_ki_ku KI_ROW

- 이미 kanji_data.json에 있는 한자는 건너뜁니다.
- 상용1/2 쪽수(source)는 원본 상용한자 파일에서 가져옵니다.
- 음 규칙(rule)은 RULES의 대표 패턴만 적용합니다.
"""
import collections
import importlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

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

# 음독 첫 가나 -> 행 이름 (五十音)
ROW_OF = {}
for _row, _chars in {
    "あ行": "アイウエオ", "か行": "カキクケコ", "さ行": "サシスセソ", "た行": "タチツテト",
    "な行": "ナニヌネノ", "は行": "ハヒフヘホ", "ま行": "マミムメモ", "や行": "ヤユヨ",
    "ら行": "ラリルレロ", "わ行": "ワヲン",
}.items():
    for _c in _chars:
        ROW_OF[_c] = _row


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return
    module = importlib.import_module(sys.argv[1])
    rows = getattr(module, sys.argv[2])

    src = json.load(open(SRC, encoding="utf-8"))
    by = collections.defaultdict(list)
    for x in src:
        by[x["kanji"]].append(x)

    entries = json.load(open(DATA, encoding="utf-8"))
    existing = {e["kanji"] for e in entries}

    added, skipped = [], []
    for (kanji, on, kun, hun, ex1, ex1_ko, ex2, ex2_ko, ja, ko, jeong) in rows:
        if kanji in existing:
            skipped.append(kanji)
            continue
        parts = hun.split()
        if len(parts) == 1:          # 한국 음 없이 뜻만 있는 경우 (훈만 가진 한자)
            sound, meaning = "", hun
        else:
            sound = parts[-1]
            meaning = hun[: -len(sound)].strip()
        if on in ("", "—"):
            row = "훈만 가진 한자"
        else:
            row = ROW_OF.get(on[0], "기타")
        source = " / ".join(
            f"{LABEL.get(x['category'], x['category'])} p.{x['page']}" for x in by.get(kanji, [])
        ) or None
        added.append({
            "row": row, "kanji": kanji, "jeongja": jeong, "on": on, "kun": kun,
            "sound": sound, "meaning": meaning, "rule": RULES.get(sound), "source": source,
            "examples": [ex1, ex2], "examples_ko": [ex1_ko, ex2_ko],
            "sentence": {"ja": ja, "ko": ko},
        })

    entries.extend(added)
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)

    print("added", len(added), "skipped", skipped)
    print("total", len(entries))
    print("rows", dict(collections.Counter(e["row"] for e in entries)))


if __name__ == "__main__":
    main()
