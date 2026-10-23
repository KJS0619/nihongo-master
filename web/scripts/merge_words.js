const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data');

// Load main detail file
const detail = require(path.join(dataPath, 'jlpt_words_detail.json'));

// Get existing words by key (word + reading)
const existingKeys = new Set();
detail.words.forEach(w => existingKeys.add(w.word + '|' + w.reading));

console.log('Current jlpt_words_detail.json:', detail.words.length);

// Get all batch files
const allFiles = fs.readdirSync(dataPath).filter(f => f.endsWith('.json'));
const batchFiles = allFiles.filter(f =>
  (f.startsWith('n3_') || f.startsWith('n4_') || f.startsWith('n5_')) ||
  f === 'jlpt_n4_words.json' || f === 'jlpt_n5_words.json'
);

console.log('\nProcessing', batchFiles.length, 'batch files...\n');

let totalAdded = 0;

batchFiles.forEach(file => {
  try {
    const rawData = require(path.join(dataPath, file));
    let words = [];

    // Handle different formats
    if (rawData.words && Array.isArray(rawData.words)) {
      words = rawData.words;
    } else if (Array.isArray(rawData)) {
      words = rawData;
    } else if (typeof rawData === 'object') {
      // Handle object with numeric keys (like n3_verbs_batch1.json)
      const keys = Object.keys(rawData);
      if (keys.length > 0 && !isNaN(keys[0])) {
        words = Object.values(rawData);
      }
    }

    if (words.length === 0) return;

    // Filter words that have required fields
    const validWords = words.filter(w => w && w.word && w.reading && w.meaning);

    const newWords = validWords.filter(w => {
      const key = w.word + '|' + w.reading;
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        return true;
      }
      return false;
    });

    if (newWords.length > 0) {
      console.log(`${file}: +${newWords.length} new words (from ${validWords.length} valid)`);

      // Ensure required fields
      newWords.forEach(w => {
        if (!w.jlpt) {
          if (file.includes('n5')) w.jlpt = 'N5';
          else if (file.includes('n4')) w.jlpt = 'N4';
          else if (file.includes('n3')) w.jlpt = 'N3';
          else if (file.includes('n2')) w.jlpt = 'N2';
          else if (file.includes('n1')) w.jlpt = 'N1';
          else w.jlpt = 'N5';
        }
        if (!w.category) w.category = '기타';
        if (!w.frequency) w.frequency = 9999;
      });

      detail.words.push(...newWords);
      totalAdded += newWords.length;
    }
  } catch(e) {
    console.log(`${file}: error - ${e.message}`);
  }
});

console.log('\n---');
console.log('Total added:', totalAdded);
console.log('Final word count:', detail.words.length);

// Sort by jlpt level and frequency
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
console.log('\nLevel distribution:', levelCounts);

// Save
fs.writeFileSync(
  path.join(dataPath, 'jlpt_words_detail.json'),
  JSON.stringify(detail, null, 2),
  'utf8'
);
console.log('\nSaved to jlpt_words_detail.json');
