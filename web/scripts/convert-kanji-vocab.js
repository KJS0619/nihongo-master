// Convert kanji-vocab JS files to JSON
const fs = require('fs');
const path = require('path');

const sourceDir = 'D:/vercel-projects/kanji-vocab-temp';
const targetDir = 'D:/vercel-projects/nihongo-master/web/public/data/kanji-vocab';

// Convert day files
for (let i = 1; i <= 22; i++) {
  const dayNum = i.toString().padStart(2, '0');
  const sourceFile = path.join(sourceDir, `day${dayNum}.js`);
  const targetFile = path.join(targetDir, `day${dayNum}.json`);

  let content = fs.readFileSync(sourceFile, 'utf8');

  // Extract the array from the JS file
  const match = content.match(/const day\d+Cards\s*=\s*(\[[\s\S]*\]);?$/m);
  if (match) {
    // Parse the array (it's valid JSON-like syntax)
    const arrayStr = match[1];
    // Replace single quotes with double quotes for JSON compatibility
    const jsonStr = arrayStr
      .replace(/'/g, '"')
      .replace(/,\s*\]/g, ']')  // Remove trailing commas
      .replace(/,\s*$/g, '');    // Remove trailing comma at end

    try {
      const data = eval(match[1]); // Using eval since it's valid JS
      fs.writeFileSync(targetFile, JSON.stringify(data, null, 2));
      console.log(`Converted day${dayNum}.js -> day${dayNum}.json (${data.length} cards)`);
    } catch (e) {
      console.error(`Error converting day${dayNum}.js:`, e.message);
    }
  }
}

// Convert kanji-glossary
const glossarySource = path.join(sourceDir, 'kanji-glossary.js');
const glossaryTarget = path.join(targetDir, 'kanji-glossary.json');

let glossaryContent = fs.readFileSync(glossarySource, 'utf8');
const glossaryMatch = glossaryContent.match(/const kanjiGlossary\s*=\s*(\{[\s\S]*\});?$/m);
if (glossaryMatch) {
  try {
    const data = eval('(' + glossaryMatch[1] + ')');
    fs.writeFileSync(glossaryTarget, JSON.stringify(data, null, 2));
    console.log(`Converted kanji-glossary.js -> kanji-glossary.json (${Object.keys(data).length} entries)`);
  } catch (e) {
    console.error('Error converting kanji-glossary.js:', e.message);
  }
}

console.log('Done!');
