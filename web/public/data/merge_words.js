const fs = require('fs');
const path = require('path');

const dataDir = __dirname;

// 병합할 파일 목록 (순서대로)
const n5Files = [
  'jlpt_n5_words.json',
  'n5_verbs_batch1.json',
  'n5_verbs_batch2.json',
  'n5_verbs_batch3.json',
  'n5_nouns_batch1.json',
  'n5_nouns_batch2.json',
  'n5_nouns_misc.json',
  'n5_adjectives.json',
  'n5_adverbs_time.json',
  'n5_particles_conjunctions.json',
  'n5_expressions.json',
  'n5_batch2.json',
  'n5_batch3.json',
  'n5_batch4.json',
  'n5_batch5.json',
  'n5_batch6.json',
  'n5_final_batch.json',
  'n5_additional_198.json'
];

const n4Files = [
  'jlpt_n4_words.json',
  'n4_words_batch6.json',
  'n4_final_batch.json'
];

const n3Files = [
  'n3_verbs_batch1.json',
  'n3_nouns_batch1.json',
  'n3_verbs_batch2.json',
  'n3_nouns_batch2.json',
  'n3_adjectives_batch1.json',
  'n3_verbs_batch3.json',
  'n3_adverbs_batch1.json',
  'n3_verbs_batch4.json',
  'n3_nouns_batch3.json',
  'n3_expressions_batch1.json',
  'n3_verbs_batch5.json',
  'n3_nouns_batch4.json',
  'n3_verbs_batch6.json',
  'n3_nouns_batch5.json',
  'n3_adjectives_batch2.json',
  'n3_nouns_batch6.json',
  'n3_verbs_batch7.json',
  'n3_nouns_batch7.json',
  'n3_verbs_batch8.json',
  'n3_expressions_batch2.json',
  'n3_nouns_batch8.json',
  'n3_verbs_batch9.json',
  'n3_nouns_batch9.json',
  'n3_verbs_batch10.json',
  'n3_nouns_batch10.json',
  'n3_adjectives_batch3.json',
  'n3_nouns_batch11.json',
  'n3_verbs_batch11.json',
  'n3_nouns_batch12.json',
  'n3_adverbs_batch2.json',
  'n3_nouns_batch13.json',
  'n3_verbs_batch12.json',
  'n3_nouns_batch14.json',
  'n3_verbs_batch13.json',
  'n3_nouns_batch15.json',
  'n3_verbs_batch14.json',
  'n3_nouns_batch16.json',
  'n3_nouns_batch17.json',
  'n3_verbs_batch15.json',
  'n3_nouns_batch18.json',
  'n3_verbs_batch16.json',
  'n3_nouns_batch19.json',
  'n3_verbs_batch17.json',
  'n3_nouns_batch20.json',
  'n3_verbs_batch18.json',
  'n3_nouns_batch21.json',
  'n3_verbs_batch19.json',
  'n3_nouns_batch22.json',
  'n3_verbs_batch20.json',
  'n3_nouns_batch23.json',
  'n3_verbs_batch21.json',
  'n3_nouns_batch24.json',
  'n3_verbs_batch22.json',
  'n3_nouns_batch25.json',
  'n3_verbs_batch23.json',
  'n3_nouns_batch26.json',
  'n3_verbs_batch24.json',
  'n3_nouns_batch27.json',
  'n3_verbs_batch25.json',
  'n3_nouns_batch28.json',
  'n3_verbs_batch26.json',
  'n3_nouns_batch29.json',
  'n3_verbs_batch27.json',
  'n3_nouns_batch30.json',
  'n3_verbs_batch28.json',
  'n3_nouns_batch31.json',
  'n3_verbs_batch29.json',
  'n3_nouns_batch32.json',
  'n3_verbs_batch30.json',
  'n3_nouns_batch33.json',
  'n3_verbs_batch31.json',
  'n3_nouns_batch34.json',
  'n3_verbs_batch32.json',
  'n3_nouns_batch35.json',
  'n3_verbs_batch33.json',
  'n3_nouns_batch36.json',
  'n3_verbs_batch34.json',
  'n3_nouns_batch37.json',
  'n3_verbs_batch35.json',
  'n3_nouns_batch38.json',
  'n3_verbs_batch36.json',
  'n3_nouns_batch39.json',
  'n3_verbs_batch37.json',
  'n3_nouns_batch40.json',
  'n3_verbs_batch38.json',
  'n3_nouns_batch41.json',
  'n3_verbs_batch39.json',
  'n3_nouns_batch42.json',
  'n3_verbs_batch40.json',
  'n3_nouns_batch43.json',
  'n3_verbs_batch41.json',
  'n3_nouns_batch44.json',
  'n3_verbs_batch42.json',
  'n3_nouns_batch45.json',
  'n3_verbs_batch43.json',
  'n3_nouns_batch46.json',
  'n3_verbs_batch44.json',
  'n3_nouns_batch47.json',
  'n3_verbs_batch45.json',
  'n3_nouns_batch48.json',
  'n3_verbs_batch46.json',
  'n3_nouns_batch49.json',
  'n3_verbs_batch47.json',
  'n3_nouns_batch50.json',
  'n3_verbs_batch48.json',
  'n3_nouns_batch51.json',
  'n3_verbs_batch49.json',
  'n3_nouns_batch52.json',
  'n3_verbs_batch50.json',
  'n3_nouns_batch53.json',
  'n3_verbs_batch51.json',
  'n3_nouns_batch54.json',
  'n3_verbs_batch52.json',
  'n3_nouns_batch55.json'
];

function loadJsonFile(filename) {
  const filepath = path.join(dataDir, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`파일 없음: ${filename}`);
    return [];
  }
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    // 배열이면 그대로, words 필드가 있으면 words 반환
    if (Array.isArray(data)) return data;
    if (data.words && Array.isArray(data.words)) return data.words;
    return [];
  } catch (e) {
    console.error(`파싱 에러: ${filename}`, e.message);
    return [];
  }
}

// N5 단어 수집
console.log('=== N5 단어 수집 ===');
let n5Words = [];
for (const file of n5Files) {
  const words = loadJsonFile(file);
  console.log(`${file}: ${words.length}개`);
  n5Words = n5Words.concat(words);
}

// N4 단어 수집
console.log('\n=== N4 단어 수집 ===');
let n4Words = [];
for (const file of n4Files) {
  const words = loadJsonFile(file);
  console.log(`${file}: ${words.length}개`);
  n4Words = n4Words.concat(words);
}

// N3 단어 수집
console.log('\n=== N3 단어 수집 ===');
let n3Words = [];
for (const file of n3Files) {
  const words = loadJsonFile(file);
  console.log(`${file}: ${words.length}개`);
  n3Words = n3Words.concat(words);
}

// 중복 제거 (word + reading 기준)
function removeDuplicates(words) {
  const seen = new Set();
  return words.filter(w => {
    const key = `${w.word}_${w.reading}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function wordKey(word) {
  return `${word.word}_${word.reading}`;
}

// 같은 단어가 여러 레벨에 들어간 경우에는 낮은 레벨(N5)을 학습 항목으로
// 유지한다. 단, 상위 레벨 원본에 예문·활용 등 더 풍부한 정보가 있다면
// 해당 정보만 보강해 데이터 손실을 막는다.
function enrichWord(primary, duplicate) {
  const enriched = { ...primary };
  const arrayFields = ['examples', 'conjugations', 'relatedWords', 'kanji', 'tags'];

  for (const field of arrayFields) {
    if (Array.isArray(duplicate[field]) &&
        (!Array.isArray(enriched[field]) || duplicate[field].length > enriched[field].length)) {
      enriched[field] = duplicate[field];
    }
  }

  if ((!enriched.meaningDetail || enriched.meaningDetail.length < duplicate.meaningDetail?.length) &&
      duplicate.meaningDetail) {
    enriched.meaningDetail = duplicate.meaningDetail;
  }

  return enriched;
}

function removeCrossLevelDuplicates(lowerLevelWords, higherLevelWords) {
  const lowerLevelByKey = new Map(lowerLevelWords.map(word => [wordKey(word), word]));
  let removedCount = 0;

  const uniqueHigherLevelWords = higherLevelWords.filter(word => {
    const duplicate = lowerLevelByKey.get(wordKey(word));
    if (!duplicate) return true;

    lowerLevelByKey.set(wordKey(word), enrichWord(duplicate, word));
    removedCount += 1;
    return false;
  });

  return {
    lowerLevelWords: lowerLevelWords.map(word => lowerLevelByKey.get(wordKey(word))),
    higherLevelWords: uniqueHigherLevelWords,
    removedCount
  };
}

n5Words = removeDuplicates(n5Words);
n4Words = removeDuplicates(n4Words);
n3Words = removeDuplicates(n3Words);

// N5 vs N4 중복 제거
const crossN5N4 = removeCrossLevelDuplicates(n5Words, n4Words);
n5Words = crossN5N4.lowerLevelWords;
n4Words = crossN5N4.higherLevelWords;

// N5+N4 vs N3 중복 제거 (N5, N4에 이미 있는 단어는 N3에서 제거)
const n5n4Combined = [...n5Words, ...n4Words];
const crossN5N4N3 = removeCrossLevelDuplicates(n5n4Combined, n3Words);
n3Words = crossN5N4N3.higherLevelWords;

console.log(`\n=== 중복 제거 후 ===`);
console.log(`N5: ${n5Words.length}개`);
console.log(`N4: ${n4Words.length}개`);
console.log(`N3: ${n3Words.length}개`);
console.log(`N5/N4 레벨 간 중복 제거: ${crossN5N4.removedCount}개`);
console.log(`N5+N4/N3 레벨 간 중복 제거: ${crossN5N4N3.removedCount}개`);

// ID 재할당
n5Words = n5Words.map((w, i) => ({ ...w, id: `n5_w${String(i + 1).padStart(4, '0')}`, jlpt: 'N5' }));
n4Words = n4Words.map((w, i) => ({ ...w, id: `n4_w${String(i + 1).padStart(4, '0')}`, jlpt: 'N4' }));
n3Words = n3Words.map((w, i) => ({ ...w, id: `n3_w${String(i + 1).padStart(4, '0')}`, jlpt: 'N3' }));

// 전체 병합
const allWords = [...n5Words, ...n4Words, ...n3Words];

// 최종 데이터 구조
const finalData = {
  version: '2.1.0',
  lastUpdated: new Date().toISOString().split('T')[0],
  totalCount: allWords.length,
  n5Count: n5Words.length,
  n4Count: n4Words.length,
  n3Count: n3Words.length,
  n2Count: 0,
  n1Count: 0,
  words: allWords
};

// 저장
const outputPath = path.join(dataDir, 'jlpt_words_detail.json');
fs.writeFileSync(outputPath, JSON.stringify(finalData, null, 2), 'utf-8');

console.log(`\n=== 완료 ===`);
console.log(`총 ${allWords.length}개 단어 저장됨`);
console.log(`  - N5: ${n5Words.length}개`);
console.log(`  - N4: ${n4Words.length}개`);
console.log(`  - N3: ${n3Words.length}개`);
console.log(`저장 위치: ${outputPath}`);
