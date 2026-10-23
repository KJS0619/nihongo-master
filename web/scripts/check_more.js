const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../public/data');
const detail = require(path.join(dataPath, 'jlpt_words_detail.json'));
const jlpt = require(path.join(dataPath, 'jlpt_words.json'));
const n4 = require(path.join(dataPath, 'jlpt_n4_words.json'));
const n5 = require(path.join(dataPath, 'jlpt_n5_words.json'));

const existingKeys = new Set();
detail.words.forEach(w => existingKeys.add(w.word + '|' + w.reading));

console.log('Current total:', detail.words.length);

// Check jlpt_words
let jlptNew = jlpt.words.filter(w => !existingKeys.has(w.word + '|' + w.reading));
console.log('\njlpt_words.json unique:', jlptNew.length);

// Check n4
let n4New = n4.words.filter(w => !existingKeys.has(w.word + '|' + w.reading));
console.log('jlpt_n4_words.json unique:', n4New.length);

// Check n5
let n5New = n5.words.filter(w => !existingKeys.has(w.word + '|' + w.reading));
console.log('jlpt_n5_words.json unique:', n5New.length);

// Level distribution in current detail
const levels = {};
detail.words.forEach(w => {
  levels[w.jlpt] = (levels[w.jlpt] || 0) + 1;
});
console.log('\nCurrent level distribution:', levels);

// Still need about 4600 more words to reach 10,000
console.log('\nNeeded for 10,000:', 10000 - detail.words.length);
