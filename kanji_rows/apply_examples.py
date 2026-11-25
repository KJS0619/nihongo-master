"""예문 사전(EXAMPLES)을 kanji_data.json에 채웁니다. 이미 예문이 있는 글자는 건드리지 않습니다.

사용법 (프로젝트 루트에서):
    python kanji_rows/apply_examples.py fill_examples_ka1 EXAMPLES_KA1

EXAMPLES 형식: "글자": ((예문1, 뜻1), (예문2, 뜻2), (예문 일본어, 예문 한국어))
"""
import importlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
DATA = r"D:\vercel-projects\nihongo-master\kanji_data.json"


def main():
    module = importlib.import_module(sys.argv[1])
    examples = getattr(module, sys.argv[2])
    entries = json.load(open(DATA, encoding="utf-8"))
    filled = 0
    for e in entries:
        if e["kanji"] in examples and not e["examples"]:
            (w1, k1), (w2, k2), (ja, ko) = examples[e["kanji"]]
            e["examples"] = [w1, w2]
            e["examples_ko"] = [k1, k2]
            e["sentence"] = {"ja": ja, "ko": ko}
            filled += 1
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=1)
    print("filled", filled)


if __name__ == "__main__":
    main()
