// Process a single new YouTube video into a structured recipe
// 1. Download Hindi transcript via yt-dlp
// 2. Parse VTT to clean text
// 3. Send to Claude API → structured recipe JSON
// 4. Generate Hindi translation
// 5. Transliterate to Urdu + Marathi

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');

const transcriptDir = path.join(__dirname, '..', 'data', 'transcripts');
const pendingPath = path.join(__dirname, '..', 'data', 'pending-videos.json');
const skippedPath = path.join(__dirname, '..', 'data', 'skipped-videos.json');
const failedPath = path.join(__dirname, '..', 'data', 'failed-recipes.json');

// Ensure directories exist
if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir, { recursive: true });

// Load JSON safely
function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return []; }
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Parse VTT to clean text (reused from parse-new-transcripts.js)
function parseVTT(content) {
  const lines = content.split('\n');
  const textLines = [];
  let lastText = '';
  for (const line of lines) {
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:') ||
        line.includes('-->') || line.trim() === '' || line.match(/^\d+$/)) continue;
    let clean = line.replace(/<[^>]+>/g, '').trim();
    if (clean && clean !== lastText) {
      textLines.push(clean);
      lastText = clean;
    }
  }
  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Download transcript using yt-dlp
function downloadTranscript(videoId) {
  // Try system yt-dlp first, then local exe
  const ytdlpPaths = ['yt-dlp', path.join(__dirname, 'yt-dlp.exe')];
  const url = `https://www.youtube.com/watch?v=${videoId}`;

  for (const ytdlp of ytdlpPaths) {
    // Try Hindi first
    for (const lang of ['hi', 'en']) {
      const outFile = path.join(transcriptDir, `${videoId}.${lang}.vtt`);
      if (fs.existsSync(outFile)) return outFile;

      try {
        execSync(
          `"${ytdlp}" --skip-download --write-auto-sub --sub-lang ${lang} --sub-format vtt -o "${path.join(transcriptDir, videoId)}" "${url}"`,
          { timeout: 60000, stdio: 'pipe' }
        );
        if (fs.existsSync(outFile)) {
          console.log(`  Downloaded ${lang} transcript`);
          return outFile;
        }
      } catch { /* try next */ }
    }
  }

  return null;
}

// Claude API: Parse transcript into structured recipe
async function parseWithClaude(transcript, videoTitle, videoId) {
  const client = new Anthropic();

  const prompt = `You are parsing a cooking video transcript from "Rubina's Zaika" YouTube channel into structured recipe data.

VIDEO TITLE: ${videoTitle}
VIDEO ID: ${videoId}
TRANSCRIPT:
${transcript}

IMPORTANT RULES:
1. If this is NOT a cooking recipe video (e.g., vlog, Q&A, channel update), respond with ONLY: {"skip": true, "reason": "not a recipe"}
2. Extract ACTUAL ingredients and quantities mentioned in the transcript — do NOT guess or make up data
3. The channel is Hindi/Urdu speaking — the greeting is usually "Assalamu Alaikum"
4. Keep method steps concise but complete
5. Category MUST be one of: nonveg, snacks, sweets, maincourse, breakfast, chutney
6. Estimate servings, prepTime, cookTime, and difficulty from context

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "title": "English title of the recipe",
  "titleHi": "Hindi title in Devanagari script",
  "category": "one of: nonveg, snacks, sweets, maincourse, breakfast, chutney",
  "servings": "e.g. 4-5",
  "prepTime": "e.g. 20 min",
  "cookTime": "e.g. 30 min",
  "difficulty": "Easy or Medium or Hard",
  "description": "1-2 sentence English description of the dish",
  "intro": "English intro/greeting from the video",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
  "method": ["Step 1 description.", "Step 2 description."],
  "outro": "English outro/closing from the video",
  "tips": ["Tip 1", "Tip 2"],
  "hi": {
    "title": "Hindi title",
    "description": "Hindi description",
    "intro": "Hindi intro (from transcript)",
    "ingredients": ["Hindi ingredient 1", "Hindi ingredient 2"],
    "method": ["Hindi step 1", "Hindi step 2"],
    "outro": "Hindi outro",
    "tips": ["Hindi tip 1", "Hindi tip 2"]
  }
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text.trim();

  // Try to parse JSON (handle potential markdown wrapping)
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Claude did not return valid JSON');
    }
  }

  return json;
}

// Validate recipe structure
function validateRecipe(recipe) {
  const required = ['title', 'titleHi', 'category', 'description', 'ingredients', 'method'];
  for (const field of required) {
    if (!recipe[field]) return `Missing field: ${field}`;
  }

  const validCategories = ['nonveg', 'snacks', 'sweets', 'maincourse', 'breakfast', 'chutney'];
  if (!validCategories.includes(recipe.category)) return `Invalid category: ${recipe.category}`;

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return 'Empty ingredients';
  if (!Array.isArray(recipe.method) || recipe.method.length === 0) return 'Empty method';

  return null;
}

// Process a single video
async function processVideo(video) {
  const { id, title } = video;
  console.log(`\nProcessing: ${id} — ${title}`);

  // Step 1: Download transcript
  console.log('  Downloading transcript...');
  const vttFile = downloadTranscript(id);
  if (!vttFile) {
    console.log('  No transcript available — adding to pending');
    return { status: 'pending', reason: 'no transcript' };
  }

  // Step 2: Parse VTT
  const vttContent = fs.readFileSync(vttFile, 'utf8');
  const transcript = parseVTT(vttContent);
  if (transcript.length < 50) {
    console.log('  Transcript too short — adding to pending');
    return { status: 'pending', reason: 'transcript too short' };
  }
  console.log(`  Transcript: ${transcript.length} chars`);

  // Step 3: Call Claude API
  console.log('  Parsing with Claude...');
  let parsed;
  try {
    parsed = await parseWithClaude(transcript, title, id);
  } catch (err) {
    console.error(`  Claude API error: ${err.message}`);
    return { status: 'failed', reason: err.message };
  }

  // Check if video was identified as non-recipe
  if (parsed.skip) {
    console.log(`  Skipped: ${parsed.reason}`);
    return { status: 'skipped', reason: parsed.reason };
  }

  // Step 4: Validate
  const validationError = validateRecipe(parsed);
  if (validationError) {
    console.error(`  Validation failed: ${validationError}`);
    return { status: 'failed', reason: validationError, data: parsed };
  }

  // Step 5: Build final recipe object
  const recipe = {
    id,
    title: parsed.title,
    titleHi: parsed.titleHi,
    category: parsed.category,
    views: video.views || 0,
    duration: video.duration || '0:00',
    servings: parsed.servings || '4',
    prepTime: parsed.prepTime || '15 min',
    cookTime: parsed.cookTime || '30 min',
    difficulty: parsed.difficulty || 'Medium',
    description: parsed.description,
    intro: parsed.intro || '',
    ingredients: parsed.ingredients,
    method: parsed.method,
    outro: parsed.outro || '',
    tips: parsed.tips || []
  };

  // Hindi translation from Claude
  const hi = parsed.hi || {};

  console.log(`  Success: "${recipe.title}" (${recipe.category}, ${recipe.ingredients.length} ingredients, ${recipe.method.length} steps)`);

  return {
    status: 'success',
    recipe,
    hi: {
      title: hi.title || parsed.titleHi,
      description: hi.description || parsed.description,
      intro: hi.intro || parsed.intro || '',
      ingredients: hi.ingredients || parsed.ingredients,
      method: hi.method || parsed.method,
      outro: hi.outro || parsed.outro || '',
      tips: hi.tips || parsed.tips || []
    }
  };
}

// Main: process all new videos from new-videos.json
async function main() {
  const newVideosPath = path.join(__dirname, '..', 'data', 'new-videos.json');
  if (!fs.existsSync(newVideosPath)) {
    console.log('No new-videos.json found. Run fetch-channel-videos.js first.');
    process.exit(0);
  }

  const newVideos = JSON.parse(fs.readFileSync(newVideosPath, 'utf8'));
  if (newVideos.length === 0) {
    console.log('No new videos to process.');
    process.exit(0);
  }

  const pending = loadJSON(pendingPath);
  const skipped = loadJSON(skippedPath);
  const failed = loadJSON(failedPath);
  const successResults = [];

  for (const video of newVideos) {
    const result = await processVideo(video);

    switch (result.status) {
      case 'success':
        successResults.push(result);
        break;
      case 'pending':
        pending.push({ id: video.id, title: video.title, reason: result.reason, date: new Date().toISOString() });
        break;
      case 'skipped':
        skipped.push({ id: video.id, title: video.title, reason: result.reason, date: new Date().toISOString() });
        break;
      case 'failed':
        failed.push({ id: video.id, title: video.title, reason: result.reason, date: new Date().toISOString() });
        break;
    }
  }

  // Save tracking files
  saveJSON(pendingPath, pending);
  saveJSON(skippedPath, skipped);
  saveJSON(failedPath, failed);

  // Save successful results for update-recipe-data.js
  const outputPath = path.join(__dirname, '..', 'data', 'processed-recipes.json');
  saveJSON(outputPath, successResults);

  console.log(`\nDone: ${successResults.length} success, ${pending.length} pending, ${skipped.length} skipped, ${failed.length} failed`);

  // Clean up new-videos.json
  fs.unlinkSync(newVideosPath);

  return successResults;
}

// Also export for direct use
module.exports = { processVideo, parseWithClaude, parseVTT, downloadTranscript };

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
