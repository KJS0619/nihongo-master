#!/usr/bin/env python3
"""
단어에 예문을 추가하는 스크립트
사용법: python word_examples/apply_word_examples.py <module_name> <dict_name>
예: python word_examples/apply_word_examples.py examples_n5 EXAMPLES_N5
"""
import sys
import json
import importlib
from pathlib import Path

DATA = Path(__file__).parent.parent / "web/public/data/jlpt_words_detail.json"

def main():
    if len(sys.argv) < 3:
        print("Usage: python apply_word_examples.py <module_name> <dict_name>")
        sys.exit(1)

    module_name = sys.argv[1]
    dict_name = sys.argv[2]

    # Import the module
    sys.path.insert(0, str(Path(__file__).parent))
    module = importlib.import_module(module_name)
    examples = getattr(module, dict_name)

    # Load data
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words", [])
    filled = 0

    for w in words:
        word = w.get("word")
        if word in examples and not w.get("examples"):
            ex_list = examples[word]
            w["examples"] = [
                {"ja": ex["ja"], "reading": ex.get("reading", ""), "ko": ex["ko"]}
                for ex in ex_list
            ]
            filled += 1

    # Save
    with open(DATA, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"filled {filled}")

if __name__ == "__main__":
    main()
