const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data');
const detail = require(path.join(dataPath, 'jlpt_words_detail.json'));
const jlpt = require(path.join(dataPath, 'jlpt_words.json'));

const existingKeys = new Set();
detail.words.forEach(w => existingKeys.add(w.word + '|' + w.reading));

console.log('Before:', detail.words.length);

// Add unique words from jlpt_words
let added = 0;
jlpt.words.forEach((w, idx) => {
  const key = w.word + '|' + w.reading;
  if (!existingKeys.has(key)) {
    existingKeys.add(key);

    // Ensure all required fields
    const newWord = {
      ...w,
      id: w.id || `extra_${idx}`,
      meaningDetail: w.meaningDetail || '',
      pitch: w.pitch || [],
      examples: w.examples || [],
      conjugations: w.conjugations || [],
      relatedWords: w.relatedWords || [],
      kanji: w.kanji || [],
      tags: w.tags || [],
      frequency: w.frequency || 9000 + idx
    };

    detail.words.push(newWord);
    added++;
  }
});

console.log('Added:', added);
console.log('After:', detail.words.length);

// Sort
const jlptOrder = { N5: 1, N4: 2, N3: 3, N2: 4, N1: 5 };
detail.words.sort((a, b) => {
  const levelDiff = (jlptOrder[a.jlpt] || 99) - (jlptOrder[b.jlpt] || 99);
  if (levelDiff !== 0) return levelDiff;
  return (a.frequency || 9999) - (b.frequency || 9999);
});

// Reassign IDs
detail.words.forEach((w, i) => {
  const level = w.jlpt || 'N5';
  w.id = `${level.toLowerCase()}_w${String(i + 1).padStart(4, '0')}`;
});

// Count by level
const levelCounts = {};
detail.words.forEach(w => {
  levelCounts[w.jlpt] = (levelCounts[w.jlpt] || 0) + 1;
});
console.log('Level distribution:', levelCounts);

// Save
fs.writeFileSync(
  path.join(dataPath, 'jlpt_words_detail.json'),
  JSON.stringify(detail, null, 2),
  'utf8'
);
console.log('Saved!');
