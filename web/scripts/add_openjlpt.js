const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data');

// Load files
const detail = require(path.join(dataPath, 'jlpt_words_detail.json'));
const source = require(path.join(dataPath, 'openjlpt_n3_source.json'));

// Get existing words
const existingKeys = new Set();
detail.words.forEach(w => existingKeys.add(w.word + '|' + w.reading));

console.log('Current words:', detail.words.length);
console.log('Source N3 words:', source.length);

// Korean meaning mappings for common words (basic)
const meaningMap = {
  'ice cream': '아이스크림',
  'mail': '메일, 우편',
  'idea': '아이디어, 생각',
  'iron': '다리미, 철',
};

// Convert and add new words
let added = 0;
source.forEach((w, idx) => {
  // Use word as reading if reading is empty
  const reading = w.reading || w.word;
  const key = w.word + '|' + reading;

  if (existingKeys.has(key)) return;
  existingKeys.add(key);

  // Convert English meaning to Korean (basic conversion)
  const engMeaning = w.meanings.join(', ');
  let korMeaning = meaningMap[engMeaning.toLowerCase()] || engMeaning;

  // Create word entry
  const newWord = {
    id: `n3_src_${String(idx + 1).padStart(4, '0')}`,
    word: w.word,
    reading: reading,
    meaning: korMeaning,
    meaningDetail: '',
    jlpt: w.level || 'N3',
    category: guessCategory(w.word, reading),
    pitch: [],
    examples: (w.examples || []).slice(0, 2).map(ex => ({
      ja: ex.ja,
      reading: '',
      ko: ex.en || ''
    })),
    conjugations: [],
    relatedWords: [],
    kanji: [],
    tags: [],
    frequency: 5000 + idx
  };

  detail.words.push(newWord);
  added++;
});

function guessCategory(word, reading) {
  // Guess category based on word ending
  if (reading.endsWith('る') || reading.endsWith('う') || reading.endsWith('つ') ||
      reading.endsWith('く') || reading.endsWith('ぐ') || reading.endsWith('す') ||
      reading.endsWith('む') || reading.endsWith('ぬ') || reading.endsWith('ぶ')) {
    return '동사';
  }
  if (reading.endsWith('い') || reading.endsWith('な')) {
    return '형용사';
  }
  return '명사';
}

console.log('Added:', added);
console.log('Final count:', detail.words.length);

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
