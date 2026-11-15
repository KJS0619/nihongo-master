/**
 * AI 생성 어원 데이터에서 오류 항목을 제거하는 스크립트
 */
const fs = require('fs');
const path = require('path');

const etymPath = path.join(__dirname, '../public/data/kanji_etymology.json');
const errorsPath = path.join(__dirname, 'etymology_errors.json');

// 데이터 로드
const etym = JSON.parse(fs.readFileSync(etymPath, 'utf8'));
const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf8'));

console.log('수정 전 어원 데이터 수:', Object.keys(etym.kanji).length);
console.log('제거할 오류 항목 수:', errors.length);

// 오류 항목 제거
let removed = 0;
for (const err of errors) {
  if (etym.kanji[err.char]) {
    delete etym.kanji[err.char];
    removed++;
  }
}

console.log('제거된 항목 수:', removed);
console.log('수정 후 어원 데이터 수:', Object.keys(etym.kanji).length);

// 메타데이터 업데이트
etym.total_count = Object.keys(etym.kanji).length;
etym.generated_at = new Date().toISOString();
etym.description = '한자 어원(형성 원리) 데이터 - 오류 수정됨';

// 저장
fs.writeFileSync(etymPath, JSON.stringify(etym, null, 2), 'utf8');
console.log('\n수정된 데이터 저장됨:', etymPath);
