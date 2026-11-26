# 일본어 단어 예문 자동 생성 스크립트

## 개요

단어 목록(`words.csv`)에 대해 자동으로 예문을 추가하는 스크립트입니다.

### 처리 파이프라인

1. **1차 매칭 (Tatoeba)**: 일본어-한국어 문장 쌍에서 단어가 포함된 짧은 문장(10~25자)을 매칭
2. **2차 생성 (Claude API)**: 매칭 실패한 단어들에 대해 Claude API로 예문 생성

## 설치

```bash
pip install anthropic
```

## 사용법

### 기본 실행

```bash
# Tatoeba 매칭만 (API 키 없이)
python generate_examples.py --words words.csv --tatoeba jpn_kor.tsv --output output.json

# Tatoeba 매칭 + Claude API 생성
python generate_examples.py --words words.csv --tatoeba jpn_kor.tsv --output output.json --api-key YOUR_API_KEY

# 환경변수로 API 키 설정
export ANTHROPIC_API_KEY=your_api_key
python generate_examples.py --words words.csv --tatoeba jpn_kor.tsv
```

### 옵션

| 옵션 | 단축 | 설명 | 기본값 |
|------|------|------|--------|
| `--words` | `-w` | 단어 목록 CSV 파일 (필수) | - |
| `--tatoeba` | `-t` | Tatoeba TSV 파일 | `jpn_kor.tsv` |
| `--output` | `-o` | 출력 JSON 파일 | `output.json` |
| `--api-key` | `-k` | Anthropic API 키 | `ANTHROPIC_API_KEY` 환경변수 |
| `--export-csv` | - | CSV로 내보내기 경로 | - |

## 입력 파일 형식

### words.csv

```csv
id,word,reading,meaning
1,基本,きほん,기본
2,練習,れんしゅう,연습
```

### jpn_kor.tsv (Tatoeba)

탭으로 구분된 일본어-한국어 문장 쌍:

```
日本語の文章	한국어 문장
これは例文です	이것은 예문입니다
```

Tatoeba 다운로드: https://tatoeba.org/ko/downloads

## 출력 형식

### output.json

```json
{
  "processed": {
    "基本": {
      "id": "1",
      "word": "基本",
      "reading": "きほん",
      "meaning": "기본",
      "example_jp": "基本的なルールを覚えましょう。",
      "example_furigana": "基本(きほん)的(てき)なルールを覚(おぼ)えましょう。",
      "example_ko": "기본적인 규칙을 외웁시다.",
      "source": "claude"
    }
  },
  "stats": {
    "tatoeba": 5,
    "claude": 3,
    "failed": 2
  }
}
```

### source 값

- `tatoeba`: Tatoeba에서 매칭된 예문
- `claude`: Claude API로 생성된 예문
- `failed`: 예문 생성 실패
- `no_api_key`: API 키 없음

## 중단 후 재개

스크립트는 진행 상황을 `output.json`에 실시간 저장합니다.
중단 후 같은 명령어로 다시 실행하면 이전 진행 상황부터 이어서 처리합니다.

```bash
# 처리 중 Ctrl+C로 중단
python generate_examples.py -w words.csv -t jpn_kor.tsv -o output.json

# 같은 명령어로 재개
python generate_examples.py -w words.csv -t jpn_kor.tsv -o output.json
# -> "[재개] 이전 진행 상황 발견: 150개 처리됨"
```

## 예문 조건 (Claude API)

- JLPT N3 수준의 자연스러운 일상 회화체
- 문장 길이: 15~25자 내외
- 해당 단어를 원형 또는 자연스러운 활용형으로 포함
- 출력 형식:
  - `example_jp`: 한자 표기 문장
  - `example_furigana`: 후리가나 괄호 표기 (예: `基本(きほん)的(てき)なルール`)
  - `example_ko`: 한국어 해석

## 설정 변경

스크립트 상단의 설정값을 수정할 수 있습니다:

```python
CHUNK_SIZE = 50          # API 호출당 단어 수
MIN_SENTENCE_LEN = 10    # Tatoeba 최소 문장 길이
MAX_SENTENCE_LEN = 25    # Tatoeba 최대 문장 길이
API_RETRY_COUNT = 3      # API 재시도 횟수
API_RETRY_DELAY = 5      # 재시도 대기 시간 (초)
```

## CSV 내보내기

```bash
python generate_examples.py -w words.csv -o output.json --export-csv result.csv
```

result.csv 형식:
```csv
id,word,reading,meaning,example_jp,example_furigana,example_ko,source
1,基本,きほん,기본,基本的なルールを覚えましょう。,基本(きほん)的(てき)なルールを覚(おぼ)えましょう。,기본적인 규칙을 외웁시다.,claude
```
