const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'rubinas zaika overview.json'), 'utf8'));
const recipeData = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'js', 'recipe-data.js'), 'utf8');

// Get existing recipe IDs
const existingIds = [];
const idRegex = /id:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = idRegex.exec(recipeData)) !== null) existingIds.push(m[1]);

const videos = data.videos || data;
let arr = Array.isArray(videos) ? videos : Object.values(videos);

function getVideoId(v) {
  if (v.id) return v.id;
  if (v.videoId) return v.videoId;
  // Extract from URL
  if (v.url) {
    const match = v.url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
  }
  // Extract from thumbnail
  if (v.thumbnailUrl) {
    const match = v.thumbnailUrl.match(/\/vi\/([^/]+)\//);
    if (match) return match[1];
  }
  return null;
}

function parseDuration(d) {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  const str = String(d);
  if (str.includes(':')) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }
  return parseInt(str) || 0;
}

// Check existing transcripts
const transcriptDir = path.join(__dirname, '..', 'data', 'transcripts');
let existingTranscripts = [];
if (fs.existsSync(transcriptDir)) {
  existingTranscripts = fs.readdirSync(transcriptDir);
}

console.log('Total videos:', arr.length);
console.log('Existing recipes:', existingIds.length);
console.log('Existing transcripts:', existingTranscripts.length);

const missing = arr.filter(v => {
  const id = getVideoId(v);
  const dur = parseDuration(v.duration);
  // >= 2 min to skip shorts
  return id && dur >= 120 && !existingIds.includes(id);
}).map(v => {
  const id = getVideoId(v);
  const hasTranscript = existingTranscripts.some(f => f.includes(id));
  return {
    id,
    title: v.title,
    duration: v.duration,
    views: v.viewCount,
    hasTranscript
  };
}).sort((a, b) => b.views - a.views);

console.log('\nMissing recipes (>= 2 min, sorted by views):', missing.length);
let withTranscript = 0;
let withoutTranscript = 0;
missing.forEach(v => {
  const flag = v.hasTranscript ? '[HAS TRANSCRIPT]' : '[NEEDS TRANSCRIPT]';
  if (v.hasTranscript) withTranscript++; else withoutTranscript++;
  console.log(`${v.id} | ${v.duration} | ${v.views} views | ${flag} | ${v.title}`);
});

console.log(`\nSummary: ${missing.length} missing recipes, ${withTranscript} have transcripts, ${withoutTranscript} need transcripts`);

// Also list shorts (< 2 min) for reference
const shorts = arr.filter(v => {
  const dur = parseDuration(v.duration);
  return dur > 0 && dur < 120;
});
console.log(`\nShorts (< 2 min): ${shorts.length} videos`);
