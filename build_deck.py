"""kanji_data.json 을 읽어 인쇄용 A4 가로 PPTX(한 장 5자)를 만듭니다.

사용법:
    python build_deck.py                      # kanji_data.json -> kanji_deck.pptx
    python build_deck.py --row あ行            # 특정 행만
    python build_deck.py --out 결과.pptx
"""
import argparse
import json
import os

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = "Malgun Gothic"
BLACK = RGBColor(0x11, 0x11, 0x11)
GRAY = RGBColor(0x66, 0x66, 0x66)
LINE = RGBColor(0xAA, 0xAA, 0xAA)
RED = RGBColor(0xC0, 0x1E, 0x1E)
BLUE = RGBColor(0x1E, 0x4F, 0xC0)
GREEN = RGBColor(0x1E, 0x7A, 0x3C)   # 상용한자 등급·쪽수
PER_SLIDE = 5


def add_text(slide, x, y, w, h, lines):
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    for i, (txt, size, bold, color) in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = txt
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.name = FONT
        r.font.color.rgb = color
    return tb


def divider(prs, blank, title, subtitle):
    s = prs.slides.add_slide(blank)
    add_text(s, 0.8, 2.6, 10.0, 1.0, [(title, 44, True, BLACK)])
    add_text(s, 0.8, 3.8, 10.0, 0.8, [(subtitle, 20, False, GRAY)])
    add_text(s, 0.8, 4.6, 10.0, 0.8, [
        ("빨간색 = 한국 정자(표준 한자) 모양이 다른 글자", 16, False, RED),
        ("파란색 = 한국 음 → 일본 음 대표 규칙", 16, False, BLUE),
    ])


def build(entries, out_path):
    prs = Presentation()
    prs.slide_width = Inches(11.69)   # A4 가로
    prs.slide_height = Inches(8.27)
    blank = prs.slide_layouts[6]

    rows = []
    for e in entries:
        if not rows or rows[-1][0] != e["row"]:
            rows.append((e["row"], []))
        rows[-1][1].append(e)

    for row_name, items in rows:
        divider(prs, blank, row_name, f"{len(items)}자 · 5자씩 구성")
        for page in range(0, len(items), PER_SLIDE):
            group = items[page:page + PER_SLIDE]
            s = prs.slides.add_slide(blank)
            add_text(s, 0.6, 0.3, 10.5, 0.5,
                     [(f"{row_name}  ({page // PER_SLIDE + 1})", 14, False, GRAY)])
            for i, e in enumerate(group):
                x = 0.5 + i * 2.2
                card = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(1.0),
                                          Inches(2.05), Inches(6.9))
                card.fill.background()
                card.line.color.rgb = LINE

                lines = [(e["kanji"], 66, True, BLACK)]
                if e.get("jeongja"):
                    lines.append((e["jeongja"], 40, True, RED))   # 한국 정자: 크게
                else:
                    lines.append(("", 40, False, BLACK))
                lines += [
                    ("", 4, False, BLACK),
                    (f"음독  {e['on']}", 14, False, BLACK),
                    (f"훈독  {e['kun']}", 14, False, BLACK),
                    (f"뜻·음  {e['meaning']} {e['sound']}", 14, False, BLACK),
                ]
                if e.get("rule"):
                    lines.append((f"규칙  {e['rule']}", 12, True, BLUE))
                if e.get("source"):
                    lines.append((e["source"], 11, False, GREEN))
                lines.append(("", 6, False, BLACK))
                lines.append(("예문·단어", 12, True, GRAY))
                ko_list = e.get("examples_ko", [])
                for i, ex in enumerate(e["examples"]):
                    ko = ko_list[i] if i < len(ko_list) else ""
                    lines.append((f"{ex}  {ko}".rstrip(), 12, False, BLACK))
                if e.get("sentence"):
                    lines.append(("예문", 12, True, GRAY))
                    lines.append((e["sentence"]["ja"], 12, False, BLACK))
                    lines.append((e["sentence"]["ko"], 11, False, GRAY))
                add_text(s, x + 0.05, 1.05, 1.95, 6.8, lines)

    # 페이지 번호 (예: 1/118) - 인쇄할 때 순서 확인용
    total = len(prs.slides)
    for idx, slide in enumerate(prs.slides, start=1):
        add_text(slide, 9.9, 7.95, 1.6, 0.3, [(f"{idx}/{total}", 10, False, GRAY)])

    prs.save(out_path)
    return total


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=os.path.join(HERE, "kanji_data.json"))
    ap.add_argument("--out", default=os.path.join(HERE, "kanji_deck.pptx"))
    ap.add_argument("--row", default=None, help="예: あ行, か行")
    args = ap.parse_args()

    with open(args.data, encoding="utf-8") as f:
        entries = json.load(f)
    if args.row:
        entries = [e for e in entries if e["row"] == args.row]
    n = build(entries, args.out)
    print(f"saved {args.out} ({n} slides, {len(entries)} entries)")


if __name__ == "__main__":
    main()
