# 상용한자 발음순 학습 자료 — 진행 기록

다음 세션에서 이어서 작업할 때 이 파일부터 읽으세요.

## 마지막 작업

- 2026-11-25: 모든 상용한자 2,136자에 대한 예문 작성 완료!
  - は행 87자 (ha1-ha7)
  - ま행 19자 (ma1)
  - や행 39자 (ya1-ya2)
  - ら행 56자 (ra1-ra2)
  - わ행 + 훈만 가진 한자 3자 (wa1)

## 다음에 할 일

1. 커밋 및 푸시: `git add . && git commit -m "Complete all 2136 kanji examples" && git push origin main`
2. 배포: `cd web && npx vercel --prod --yes`

## 현재 상태 (2026-11-25 기준)

### 예문 진행 상황

- **총 한자**: 2,136자
- **예문 완료**: 2,136자 (100%)
- **예문 미완료**: 0자

### 행별 데이터 현황

| 행 | 상태 | 글자 수 |
|---|---|---|
| あ행 | 완료 | 90 |
| か행 | 완료 | 91 |
| き행 | 완료 | 66 |
| く행 | 완료 | 6 |
| け행 | 완료 | 43 |
| こ행 | 완료 | 37 |
| さ행 | 완료 | 103 |
| た행 | 완료 | 94 |
| な행 | 완료 | 21 |
| は행 | 완료 | 54 + 87 = 141 |
| ま행 | 완료 | 41 + 19 = 60 |
| や행 | 완료 | 28 + 39 = 67 |
| ら행 | 완료 | 62 + 56 = 118 |
| わ행, 훈만 가진 한자 | 완료 | 3 |

## 예문 파일 목록

예문 파일들은 `kanji_rows/` 디렉토리에 있습니다:
- `fill_examples_sa*.py` - さ행
- `fill_examples_ta*.py` - た행
- `fill_examples_na*.py` - な행
- `fill_examples_ha*.py` - は행
- `fill_examples_ma*.py` - ま행
- `fill_examples_ya*.py` - や행
- `fill_examples_ra*.py` - ら행
- `fill_examples_wa*.py` - わ행 + 훈만 가진 한자

예문 적용: `python kanji_rows/apply_examples.py <module_name> <dict_name>`

## 파일 구조

- 데이터 파일: `kanji_data.json` (총 2,136자)
- 발음순 파일: `kanji_sound_order.json` (`python kanji_search.py --export-sorted` 로 생성)
- 웹 사본: `web/public/data/kanji_sound_order.json` (복사 필요)
- 웹 페이지: `web/src/app/learn/kanji-sound/page.tsx` (콤보박스 + 인쇄)
- 인쇄용 PPT: `python build_deck.py` → `kanji_deck.pptx`

## 글자 한 개에 들어가는 항목

`kanji`, `on`(음독 가타카나), `kun`(훈독), `sound`(한국 음), `meaning`(한국 훈),
`jeongja`(한국 정자, 모양이 다를 때만), `rule`(음 규칙, 대표 패턴만), `source`(상용1/2 쪽수),
`examples` + `examples_ko`(예문 단어 2개와 뜻), `sentence`(예문 일본어 + 한국어 해석).

## 주의

- 정자(한국 표준 한자)는 원본 파일에 없습니다. 일본 상용한자와 모양이 다른 글자만 직접 적습니다 (예: 気→氣, 帰→歸, 亀→龜, 区→區, 駆→驅, 旧→舊, 既→旣).
- 원본 파일의 같은 글자가 여러 음으로 중복되어 있을 수 있습니다 (예: 悪 아/악/오). 음독은 제가 정한 대표 음을 씁니다.
- 예문과 한글 뜻은 직접 작성한 것이라 사전으로 한 번씩 확인하는 것을 권장합니다.
