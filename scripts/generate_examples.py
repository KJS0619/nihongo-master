#!/usr/bin/env python3
"""
일본어 단어 예문 자동 생성 스크립트

처리 파이프라인:
1. Tatoeba jpn_kor.tsv에서 예문 매칭 (10-25자)
2. 매칭 실패 단어는 OpenAI API로 예문 생성
3. 50단어 청크 처리, 중간 저장, 재시도 로직

사용법:
    python generate_examples.py --input words.csv --output output.json

필요 패키지:
    pip install openai pandas tqdm
"""

import sys
# Windows 콘솔 UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

import argparse
import json
import os
import re
import time
from pathlib import Path
from typing import Optional

from openai import OpenAI
import pandas as pd
from tqdm import tqdm


# ============================================================
# 설정
# ============================================================
CHUNK_SIZE = 50  # API 호출 시 한 번에 처리할 단어 수
MIN_SENTENCE_LEN = 10  # Tatoeba 문장 최소 길이
MAX_SENTENCE_LEN = 25  # Tatoeba 문장 최대 길이
MAX_RETRIES = 3  # API 호출 재시도 횟수
RETRY_DELAY = 5  # 재시도 대기 시간 (초)


# ============================================================
# 1단계: Tatoeba 예문 매칭
# ============================================================
def load_tatoeba(filepath: str) -> list[tuple[str, str]]:
    """Tatoeba jpn_kor.tsv 파일 로드 (일본어-한국어 쌍)"""
    pairs = []
    print(f"📂 Tatoeba 파일 로드 중: {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) >= 2:
                    jpn = parts[0].strip()
                    kor = parts[1].strip()
                    # 길이 필터링
                    if MIN_SENTENCE_LEN <= len(jpn) <= MAX_SENTENCE_LEN:
                        pairs.append((jpn, kor))
    except FileNotFoundError:
        print(f"⚠️ Tatoeba 파일을 찾을 수 없습니다: {filepath}")
        return []

    print(f"✅ {len(pairs):,}개 문장 쌍 로드 완료 (길이 {MIN_SENTENCE_LEN}-{MAX_SENTENCE_LEN}자)")
    return pairs


def match_tatoeba_examples(
    words_df: pd.DataFrame,
    tatoeba_pairs: list[tuple[str, str]]
) -> dict[str, dict]:
    """Tatoeba에서 각 단어에 대한 예문 매칭"""
    results = {}

    if not tatoeba_pairs:
        return results

    print("\n🔍 Tatoeba 예문 매칭 중...")
    for _, row in tqdm(words_df.iterrows(), total=len(words_df), desc="매칭"):
        word_id = str(row['id'])
        word = row['word']

        # 해당 단어가 포함된 문장 찾기
        matches = []
        for jpn, kor in tatoeba_pairs:
            if word in jpn:
                matches.append((jpn, kor, len(jpn)))

        if matches:
            # 가장 짧은 문장 선택
            matches.sort(key=lambda x: x[2])
            best = matches[0]
            results[word_id] = {
                'id': word_id,
                'word': word,
                'reading': row['reading'],
                'meaning': row['meaning'],
                'example_jp': best[0],
                'example_furigana': None,  # Tatoeba에는 후리가나 없음
                'example_ko': best[1],
                'source': 'tatoeba'
            }

    print(f"✅ {len(results):,}개 단어 매칭 완료")
    return results


# ============================================================
# 2단계: Gemini API 예문 생성
# ============================================================
def create_prompt(words: list[dict]) -> str:
    """Gemini API용 프롬프트 생성"""
    word_list = "\n".join([
        f"- {w['word']} ({w['reading']}): {w['meaning']}"
        for w in words
    ])

    prompt = f"""다음 일본어 단어들에 대해 짧은 예문을 생성해 주세요.

[단어 목록]
{word_list}

[예문 조건]
- JLPT N3 수준의 자연스러운 일상 회화체
- 15~25자 내외의 짧은 문장
- 반드시 해당 단어를 원형 또는 자연스러운 활용형으로 포함
- 문장 끝에는 적절한 종결어미 사용 (です/ます체 또는 보통체)

[출력 형식]
각 단어에 대해 다음 JSON 형식으로 출력해 주세요:
"""
    prompt += """
{
  "word": "단어",
  "example_jp": "한자 표기 문장",
  "example_furigana": "후리가나 괄호 표기 문장 (예: 基本(きほん)的(てき)なルール)",
  "example_ko": "한국어 해석"
}

전체 결과를 JSON 배열로 출력해 주세요:
[
  {"word": "...", "example_jp": "...", "example_furigana": "...", "example_ko": "..."},
  ...
]

중요: 반드시 유효한 JSON 배열만 출력하세요. 다른 설명 텍스트 없이 JSON만 출력해 주세요."""

    return prompt


def call_openai_api(
    client: OpenAI,
    words: list[dict],
    retry_count: int = 0
) -> list[dict]:
    """OpenAI API 호출하여 예문 생성"""
    try:
        prompt = create_prompt(words)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "당신은 일본어 교육 전문가입니다. 요청에 따라 정확한 JSON 형식으로만 응답하세요."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4096
        )
        response_text = response.choices[0].message.content.strip()

        # JSON 파싱 시도
        # 코드 블록 제거
        if response_text.startswith("```"):
            response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)

        results = json.loads(response_text)
        return results

    except json.JSONDecodeError as e:
        print(f"⚠️ JSON 파싱 오류: {e}")
        if retry_count < MAX_RETRIES:
            print(f"🔄 재시도 {retry_count + 1}/{MAX_RETRIES}...")
            time.sleep(RETRY_DELAY)
            return call_openai_api(client, words, retry_count + 1)
        raise

    except Exception as e:
        print(f"⚠️ API 오류: {e}")
        if retry_count < MAX_RETRIES:
            print(f"🔄 재시도 {retry_count + 1}/{MAX_RETRIES}...")
            time.sleep(RETRY_DELAY * (retry_count + 1))  # 점진적 대기
            return call_openai_api(client, words, retry_count + 1)
        raise


def generate_examples_with_api(
    client: OpenAI,
    words_df: pd.DataFrame,
    matched_ids: set[str],
    existing_results: dict[str, dict],
    output_path: str
) -> dict[str, dict]:
    """OpenAI API로 예문 생성 (매칭 실패 단어만)"""

    # 매칭 실패한 단어만 필터링
    unmatched = words_df[~words_df['id'].astype(str).isin(matched_ids)]

    # 이미 생성된 단어 제외 (재시작 시)
    already_generated = {
        wid for wid, data in existing_results.items()
        if data.get('source') in ['openai', 'gemini', 'claude']
    }
    unmatched = unmatched[~unmatched['id'].astype(str).isin(already_generated)]

    if len(unmatched) == 0:
        print("✅ 모든 단어가 이미 처리되었습니다.")
        return existing_results

    print(f"\n🤖 OpenAI API로 {len(unmatched):,}개 단어 예문 생성 중...")

    results = existing_results.copy()

    # 청크 단위로 처리
    chunks = [
        unmatched.iloc[i:i + CHUNK_SIZE]
        for i in range(0, len(unmatched), CHUNK_SIZE)
    ]

    for chunk_idx, chunk_df in enumerate(tqdm(chunks, desc="API 호출")):
        words_to_process = [
            {
                'id': str(row['id']),
                'word': row['word'],
                'reading': row['reading'],
                'meaning': row['meaning']
            }
            for _, row in chunk_df.iterrows()
        ]

        try:
            # API 호출
            generated = call_openai_api(client, words_to_process)

            # 결과 매핑
            word_to_data = {w['word']: w for w in words_to_process}

            for item in generated:
                word = item.get('word')
                if word and word in word_to_data:
                    orig = word_to_data[word]
                    results[orig['id']] = {
                        'id': orig['id'],
                        'word': word,
                        'reading': orig['reading'],
                        'meaning': orig['meaning'],
                        'example_jp': item.get('example_jp', ''),
                        'example_furigana': item.get('example_furigana', ''),
                        'example_ko': item.get('example_ko', ''),
                        'source': 'openai'
                    }

            # 중간 저장 (매 청크마다)
            save_results(results, output_path)

            # API 속도 제한 방지
            if chunk_idx < len(chunks) - 1:
                time.sleep(1)

        except Exception as e:
            print(f"\n❌ 청크 {chunk_idx + 1} 처리 중 오류: {e}")
            print("💾 현재까지의 결과 저장 중...")
            save_results(results, output_path)
            raise

    return results


# ============================================================
# 유틸리티 함수
# ============================================================
def load_results(output_path: str) -> dict[str, dict]:
    """기존 결과 파일 로드 (재시작용)"""
    if os.path.exists(output_path):
        print(f"📂 기존 결과 파일 로드: {output_path}")
        with open(output_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return {str(item['id']): item for item in data}
            return data
    return {}


def save_results(results: dict[str, dict], output_path: str):
    """결과를 JSON 파일로 저장"""
    # dict를 list로 변환 (ID 순 정렬)
    sorted_results = sorted(results.values(), key=lambda x: int(x['id']))

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_results, f, ensure_ascii=False, indent=2)


def print_summary(results: dict[str, dict], total_words: int):
    """처리 결과 요약 출력"""
    tatoeba_count = sum(1 for r in results.values() if r.get('source') == 'tatoeba')
    api_count = sum(1 for r in results.values() if r.get('source') in ['openai', 'gemini', 'claude'])
    missing_count = total_words - len(results)

    print("\n" + "=" * 50)
    print("📊 처리 결과 요약")
    print("=" * 50)
    print(f"총 단어 수:          {total_words:,}개")
    print(f"Tatoeba 매칭:        {tatoeba_count:,}개")
    print(f"API 생성:            {api_count:,}개")
    print(f"미처리:              {missing_count:,}개")
    print(f"처리율:              {len(results) / total_words * 100:.1f}%")
    print("=" * 50)


# ============================================================
# 메인 실행
# ============================================================
def main():
    parser = argparse.ArgumentParser(
        description='일본어 단어 예문 자동 생성 스크립트'
    )
    parser.add_argument(
        '--input', '-i',
        required=True,
        help='입력 단어 목록 CSV 파일 (컬럼: id, word, reading, meaning)'
    )
    parser.add_argument(
        '--tatoeba', '-t',
        default=None,
        help='Tatoeba 일본어-한국어 문장 쌍 TSV 파일 (옵션)'
    )
    parser.add_argument(
        '--output', '-o',
        default='output.json',
        help='출력 JSON 파일 경로 (기본값: output.json)'
    )
    parser.add_argument(
        '--api-key',
        default=None,
        help='OpenAI API 키 (환경변수 OPENAI_API_KEY 사용 가능)'
    )
    parser.add_argument(
        '--skip-tatoeba',
        action='store_true',
        help='Tatoeba 매칭 단계 건너뛰기'
    )
    parser.add_argument(
        '--skip-api',
        action='store_true',
        help='API 생성 단계 건너뛰기'
    )

    args = parser.parse_args()

    # API 키 확인
    api_key = args.api_key or os.environ.get('OPENAI_API_KEY')
    if not api_key and not args.skip_api:
        print("❌ OpenAI API 키가 필요합니다.")
        print("   --api-key 옵션 또는 OPENAI_API_KEY 환경변수를 설정하세요.")
        return 1

    # OpenAI 클라이언트 설정
    client = None
    if api_key:
        client = OpenAI(api_key=api_key)

    # 단어 목록 로드
    print(f"📂 단어 목록 로드 중: {args.input}")
    words_df = pd.read_csv(args.input)
    print(f"✅ {len(words_df):,}개 단어 로드 완료")

    # 기존 결과 로드 (재시작용)
    results = load_results(args.output)
    if results:
        print(f"   기존 처리 결과: {len(results):,}개")

    # 1단계: Tatoeba 매칭
    if not args.skip_tatoeba and args.tatoeba:
        tatoeba_pairs = load_tatoeba(args.tatoeba)
        tatoeba_results = match_tatoeba_examples(words_df, tatoeba_pairs)

        # 기존 결과와 병합 (Tatoeba 결과 우선)
        for word_id, data in tatoeba_results.items():
            if word_id not in results or results[word_id].get('source') not in ['gemini', 'claude']:
                results[word_id] = data

        save_results(results, args.output)

    # 2단계: OpenAI API 생성
    if not args.skip_api:
        matched_ids = set(results.keys())

        results = generate_examples_with_api(
            client,
            words_df,
            matched_ids,
            results,
            args.output
        )

        save_results(results, args.output)

    # 결과 요약
    print_summary(results, len(words_df))
    print(f"\n💾 결과 저장 완료: {args.output}")

    return 0


if __name__ == '__main__':
    exit(main())
