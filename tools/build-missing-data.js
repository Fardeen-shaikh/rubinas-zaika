// Build a JSON file with all missing video data + transcripts for recipe creation
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rubinas zaika overview.json'), 'utf8'));
const transcripts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'parsed-transcripts.json'), 'utf8'));
const recipeData = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'recipe-data.js'), 'utf8');

// Get existing recipe IDs
const existingIds = [];
const idRegex = /id:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = idRegex.exec(recipeData)) !== null) existingIds.push(m[1]);

const videos = data.videos || data;
let arr = Array.isArray(videos) ? videos : Object.values(videos);

function getVideoId(v) {
  if (v.url) {
    const match = v.url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
  }
  if (v.thumbnailUrl) {
    const match = v.thumbnailUrl.match(/\/vi\/([^/]+)\//);
    if (match) return match[1];
  }
  return null;
}

function parseDuration(d) {
  if (!d) return 0;
  const str = String(d);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parseInt(str) || 0;
}

const missing = arr.filter(v => {
  const id = getVideoId(v);
  const dur = parseDuration(v.duration);
  return id && dur >= 120 && !existingIds.includes(id) && transcripts[id];
}).map(v => {
  const id = getVideoId(v);
  return {
    id,
    title: v.title.replace(/#\S+/g, '').replace(/\|/g, '-').replace(/\s+/g, ' ').trim(),
    duration: v.duration,
    views: v.viewCount,
    transcript: transcripts[id]
  };
}).sort((a, b) => b.views - a.views);

fs.writeFileSync(path.join(__dirname, 'missing-videos-data.json'), JSON.stringify(missing, null, 2), 'utf8');
console.log(`Built data for ${missing.length} missing videos with transcripts`);

// Split into batches of ~10 for agents
const batchSize = 10;
for (let i = 0; i < missing.length; i += batchSize) {
  const batch = missing.slice(i, i + batchSize);
  const batchNum = Math.floor(i / batchSize) + 1;
  fs.writeFileSync(
    path.join(__dirname, `batch-${batchNum}.json`),
    JSON.stringify(batch, null, 2),
    'utf8'
  );
  console.log(`Batch ${batchNum}: ${batch.length} videos (${batch.map(v => v.id).join(', ')})`);
}
