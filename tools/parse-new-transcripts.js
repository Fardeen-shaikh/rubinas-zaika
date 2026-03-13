// Parse all VTT transcripts into clean text JSON (keyed by video ID)
const fs = require('fs');
const path = require('path');

const transcriptDir = path.join(__dirname, '..', 'data', 'transcripts');
const outputFile = path.join(__dirname, '..', 'data', 'parsed-transcripts.json');

function parseVTT(content) {
  const lines = content.split('\n');
  const textLines = [];
  let lastText = '';

  for (const line of lines) {
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:') ||
        line.includes('-->') || line.trim() === '' || line.match(/^\d+$/)) {
      continue;
    }
    let clean = line.replace(/<[^>]+>/g, '').trim();
    if (clean && clean !== lastText) {
      textLines.push(clean);
      lastText = clean;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

const result = {};
const files = fs.readdirSync(transcriptDir).filter(f => f.endsWith('.vtt'));

for (const file of files) {
  const id = file.replace(/\.(hi|en)\.vtt$/, '');
  const content = fs.readFileSync(path.join(transcriptDir, file), 'utf8');
  const text = parseVTT(content);
  if (text.length > 10) {
    result[id] = text;
  }
}

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
console.log(`Parsed ${Object.keys(result).length} transcripts total`);
