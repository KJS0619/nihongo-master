/**
 * 한자 어원(형성 원리) 데이터 생성 스크립트
 *
 * 사용법:
 * 1. .env 파일에 OPENAI_API_KEY 설정
 * 2. node scripts/generate_etymology.js
 *
 * 또는 커맨드라인에서:
 * OPENAI_API_KEY=sk-xxx node scripts/generate_etymology.js
 */

const fs = require('fs');
const path = require('path');

// OpenAI API 설정
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BATCH_SIZE = 20; // 한 번에 처리할 한자 수
const DELAY_MS = 1000; // 요청 간 대기 시간 (rate limit 방지)

// 프롬프트 템플릿
const SYSTEM_PROMPT = `당신은 한자 어원학 전문가입니다. 한자의 형성 원리를 한국어로 간결하게 설명해주세요.

형성 원리 유형:
- 상형(象形): 사물의 모양을 본뜬 글자 (예: 山, 日, 月)
- 지사(指事): 추상적 개념을 기호로 나타낸 글자 (예: 上, 下, 一)
- 회의(會意): 두 개 이상의 글자가 합쳐져 새 뜻을 나타내는 글자 (예: 休, 明)
- 형성(形聲): 뜻을 나타내는 부분(의부)과 소리를 나타내는 부분(성부)이 결합 (예: 江, 請)
- 전주(轉注): 본래 뜻에서 파생된 글자
- 가차(假借): 소리만 빌려 쓴 글자

각 한자에 대해 다음 형식으로 응답하세요:
[한자]|[유형]|[설명]

설명은 30-50자 이내로 간결하게 작성하세요.
부수와 구성 요소를 포함하여 기억하기 쉽게 설명하세요.

예시:
日|상형|태양의 모양을 본뜬 글자. 가운데 점은 태양의 흑점을 나타냄
休|회의|人(사람) + 木(나무) → 사람이 나무 아래서 쉬는 모습
江|형성|氵(물 수, 의부) + 工(장인 공, 성부) → 강을 뜻함. 工은 발음만 나타냄
上|지사|기준선 위에 점을 찍어 '위'라는 추상적 개념을 표현`;

async function callOpenAI(kanjiList) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `다음 한자들의 어원을 설명해주세요:\n${kanjiList.map(k => `${k.literal} (${k.korean_hun_eum || ''})`).join('\n')}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseResponse(response, kanjiList) {
  const results = {};
  const lines = response.split('\n').filter(l => l.trim());

  // 한자 리스트를 순서대로 매칭
  let lineIndex = 0;
  for (const kanji of kanjiList) {
    // 해당 한자에 대한 응답 찾기
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      const parts = line.split('|');

      if (parts.length >= 3) {
        const responseChar = parts[0].trim();
        const category = parts[1].trim();
        const description = parts.slice(2).join('|').trim();

        // 응답의 첫 글자가 해당 한자이거나, 한글 음이면 매칭
        if (responseChar === kanji.literal ||
            responseChar.length <= 2) { // 한글 음은 1-2글자
          results[kanji.literal] = {
            category,
            description
          };
          lineIndex++;
          break;
        }
      }
      lineIndex++;
    }
  }

  return results;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 환경변수가 필요합니다.');
    console.log('사용법: OPENAI_API_KEY=sk-xxx node scripts/generate_etymology.js');
    process.exit(1);
  }

  // kanji_master.json 로드
  const kanjiMasterPath = path.join(__dirname, '../public/data/kanji_master.json');
  const kanjiMaster = JSON.parse(fs.readFileSync(kanjiMasterPath, 'utf-8'));
  const allKanji = kanjiMaster.kanji;

  console.log(`📚 총 ${allKanji.length}개 한자 처리 예정`);

  // 기존 결과 파일이 있으면 로드 (이어서 작업 가능)
  const outputPath = path.join(__dirname, '../public/data/kanji_etymology.json');
  let etymology = {};

  if (fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    etymology = existing.kanji || {};
    console.log(`📂 기존 파일에서 ${Object.keys(etymology).length}개 어원 로드됨`);
  }

  // 아직 처리되지 않은 한자만 필터링
  const remaining = allKanji.filter(k => !etymology[k.literal]);
  console.log(`🔄 처리할 한자: ${remaining.length}개`);

  if (remaining.length === 0) {
    console.log('✅ 모든 한자가 이미 처리되었습니다.');
    return;
  }

  // 배치 처리
  const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);
  let processed = 0;

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`\n📝 배치 ${batchNum}/${totalBatches} 처리 중... (${batch.map(k => k.literal).join(', ')})`);

    try {
      const response = await callOpenAI(batch);
      const parsed = parseResponse(response, batch);

      // 결과 병합
      for (const [literal, data] of Object.entries(parsed)) {
        etymology[literal] = data;
      }

      processed += batch.length;

      // 중간 저장 (매 배치마다)
      const output = {
        version: '1.0.0',
        description: '한자 어원(형성 원리) 데이터',
        generated_at: new Date().toISOString(),
        total_count: Object.keys(etymology).length,
        kanji: etymology
      };

      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`✅ ${processed}/${remaining.length} 완료 (저장됨)`);

      // Rate limit 방지
      if (i + BATCH_SIZE < remaining.length) {
        await sleep(DELAY_MS);
      }
    } catch (error) {
      console.error(`❌ 배치 ${batchNum} 오류:`, error.message);
      console.log('⏸️ 10초 후 재시도...');
      await sleep(10000);
      i -= BATCH_SIZE; // 재시도
    }
  }

  console.log(`\n🎉 완료! 총 ${Object.keys(etymology).length}개 한자 어원 생성됨`);
  console.log(`📁 저장 위치: ${outputPath}`);
}

main().catch(console.error);
