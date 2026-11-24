import json, os, collections, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rows_ki_ku import KI_ROW

DATA = r"D:\vercel-projects\nihongo-master\kanji_data.json"
SRC = r"C:\Users\user\Downloads\sangyong_hanja_1_2_all (2).json"

# 음 규칙 (대표 패턴) - 예외는 적지 않음
RULES = {
    "애": "애 → アイ(아이)", "개": "개 → カイ(카이)", "가": "가 → カ(카)",
    "감": "감 → カン(칸)", "영": "영 → エイ(에이)", "왕": "왕 → オウ(오우)",
    "일": "일 → イチ/イツ(이치/이츠)", "인": "인 → イン(인)", "열": "열 → エツ(에츠)",
    "연": "연 → エン(엔)", "화": "화 → カ(카)", "한": "한 → カン(칸)",
    "기": "기 → キ(키)",
}
LABEL = {"상용한자1": "상용1", "상용한자2": "상용2"}

src = json.load(open(SRC, encoding="utf-8"))
by = collections.defaultdict(list)
for x in src:
    by[x["kanji"]].append(x)

entries = json.load(open(DATA, encoding="utf-8"))
existing = {e["kanji"] for e in entries}

added = []
skipped = []
for (kanji, on, kun, hun, ex1, ex1_ko, ex2, ex2_ko, ja, ko, jeong) in KI_ROW:
    if kanji in existing:
        skipped.append(kanji)
        continue
    sound = hun.split()[-1]
    meaning = hun[: -len(sound)].strip()
    row = "き行" if on.startswith("キ") else ("く行" if on.startswith("ク") else "기타")
    rows = by.get(kanji, [])
    source = " / ".join(f"{LABEL.get(x['category'], x['category'])} p.{x['page']}" for x in rows) or None
    added.append({
        "row": row,
        "kanji": kanji,
        "jeongja": jeong,
        "on": on,
        "kun": kun,
        "sound": sound,
        "meaning": meaning,
        "rule": RULES.get(sound),
        "source": source,
        "examples": [ex1, ex2],
        "examples_ko": [ex1_ko, ex2_ko],
        "sentence": {"ja": ja, "ko": ko},
    })

entries.extend(added)
with open(DATA, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=1)

print("added", len(added), "skipped(already present)", skipped)
print("total", len(entries))
print("rows", dict(collections.Counter(e["row"] for e in entries)))
print("no-source", [e["kanji"] for e in added if not e["source"]])
