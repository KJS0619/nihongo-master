/**
 * AI 생성 어원 데이터의 오류를 찾는 스크립트
 */
const fs = require('fs');
const path = require('path');

const etymPath = path.join(__dirname, '../public/data/kanji_etymology.json');
const bookPath = path.join(__dirname, '../public/data/hanja_book.json');

const etym = JSON.parse(fs.readFileSync(etymPath, 'utf8'));
const book = JSON.parse(fs.readFileSync(bookPath, 'utf8'));

// 기존 why에서 한자 구성요소 추출
function extractComponents(why) {
  if (!why) return null;
  const parts = [];
  // 패턴: X(... Y) 형태에서 X 추출
  const matches = why.matchAll(/([一-龯])\s*\([^)]+\)/g);
  for (const m of matches) {
    parts.push(m[1]);
  }
  return parts.length > 0 ? parts : null;
}

// 새 어원에서 한자 구성요소 추출
function extractNewComponents(desc) {
  if (!desc) return null;
  const parts = [];
  const matches = desc.matchAll(/([一-龯])\s*\([^)]+\)/g);
  for (const m of matches) {
    parts.push(m[1]);
  }
  return parts.length > 0 ? parts : null;
}

const errors = [];
const allSame = {...book.same};

for (const [char, data] of Object.entries(allSame)) {
  if (!data.why || !etym.kanji[char]) continue;

  const oldParts = extractComponents(data.why);
  const newParts = extractNewComponents(etym.kanji[char].description);

  if (oldParts && newParts) {
    // 구성요소가 다른 경우 오류로 표시
    const oldSet = new Set(oldParts);
    const newSet = new Set(newParts);
    const mismatch = [...newSet].some(p => !oldSet.has(p));

    if (mismatch) {
      errors.push({
        char,
        hun: data.hun,
        oldWhy: data.why,
        newCategory: etym.kanji[char].category,
        newDesc: etym.kanji[char].description,
        oldParts: oldParts.join(','),
        newParts: newParts.join(',')
      });
    }
  }
}

console.log('총 오류 의심 항목:', errors.length, '개');
console.log('\n처음 30개 예시:');
errors.slice(0, 30).forEach(e => {
  console.log('\n' + e.char + ' (' + e.hun + ')');
  console.log('  기존:', e.oldWhy);
  console.log('  새것:', e.newCategory, '|', e.newDesc);
});

// 오류 목록 저장
fs.writeFileSync(
  path.join(__dirname, 'etymology_errors.json'),
  JSON.stringify(errors, null, 2),
  'utf8'
);
console.log('\n오류 목록 저장됨: scripts/etymology_errors.json');
