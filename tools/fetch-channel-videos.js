// Fetch new videos from Rubina's Zaika YouTube channel
// Uses free RSS feed (no API key needed) + optional YouTube Data API for metadata

const fs = require('fs');
const path = require('path');
const https = require('https');
const vm = require('vm');

const CHANNEL_ID = 'UCRaHm_R2lWXCuYroSKLkfBg';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const recipeDataPath = path.join(__dirname, '..', 'frontend', 'js', 'recipe-data.js');
const pendingPath = path.join(__dirname, '..', 'data', 'pending-videos.json');
const skippedPath = path.join(__dirname, '..', 'data', 'skipped-videos.json');

// Load existing recipe IDs
function getExistingIds() {
  let src = fs.readFileSync(recipeDataPath, 'utf8');
  src = src.replace(/^const\s+/, 'var ');
  const ctx = vm.createContext({});
  vm.runInContext(src, ctx);
  return new Set(ctx.recipes.map(r => r.id));
}

// Load JSON file safely
function loadJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

// HTTPS GET helper
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'RubinasZaika/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Parse RSS XML to extract video entries
function parseRSS(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
    const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1];
    const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1];
    if (videoId && title) {
      entries.push({
        id: videoId,
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
        published
      });
    }
  }
  return entries;
}

// Optional: Get video duration/views from YouTube Data API v3
async function getVideoMetadata(videoIds) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log('No YOUTUBE_API_KEY set — skipping metadata fetch');
    return {};
  }

  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${apiKey}`;

  try {
    const data = JSON.parse(await httpGet(url));
    const metadata = {};
    for (const item of (data.items || [])) {
      const dur = item.contentDetails.duration; // ISO 8601: PT3M45S
      const match = dur.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(match[1] || '0', 10);
      const mins = parseInt(match[2] || '0', 10);
      const secs = parseInt(match[3] || '0', 10);
      const totalSecs = hours * 3600 + mins * 60 + secs;

      metadata[item.id] = {
        duration: `${mins + hours * 60}:${String(secs).padStart(2, '0')}`,
        totalSeconds: totalSecs,
        views: parseInt(item.statistics.viewCount || '0', 10)
      };
    }
    return metadata;
  } catch (err) {
    console.error('YouTube API error:', err.message);
    return {};
  }
}

// Main
async function main() {
  console.log('Fetching YouTube RSS feed...');
  const xml = await httpGet(RSS_URL);
  const entries = parseRSS(xml);
  console.log(`Found ${entries.length} videos in RSS feed`);

  // Load existing data
  const existingIds = getExistingIds();
  const skipped = loadJSON(skippedPath);
  const skippedIds = new Set(skipped.map(s => s.id));
  const pending = loadJSON(pendingPath);
  const pendingIds = new Set(pending.map(p => p.id));

  console.log(`Existing recipes: ${existingIds.size}`);
  console.log(`Already skipped: ${skippedIds.size}`);
  console.log(`Already pending: ${pendingIds.size}`);

  // Filter to truly new videos
  const newEntries = entries.filter(e =>
    !existingIds.has(e.id) && !skippedIds.has(e.id) && !pendingIds.has(e.id)
  );

  if (newEntries.length === 0) {
    console.log('No new videos found.');
    return [];
  }

  console.log(`New videos to process: ${newEntries.length}`);

  // Get metadata if API key available
  const metadata = await getVideoMetadata(newEntries.map(e => e.id));

  // Filter out shorts (< 2 min) if we have duration data
  const result = newEntries.filter(e => {
    const meta = metadata[e.id];
    if (meta && meta.totalSeconds < 120) {
      console.log(`SKIP ${e.id} "${e.title}" (short: ${meta.duration})`);
      return false;
    }
    return true;
  }).map(e => ({
    ...e,
    ...(metadata[e.id] || {})
  }));

  console.log(`Videos ready for processing: ${result.length}`);
  result.forEach(v => console.log(`  ${v.id} — ${v.title}`));

  // Write output for next step
  const outputPath = path.join(__dirname, '..', 'data', 'new-videos.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Written to ${outputPath}`);

  return result;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
