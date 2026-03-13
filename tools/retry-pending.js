// Retry pending videos whose transcripts weren't available earlier
// Runs after the main pipeline to catch videos that were too fresh

const fs = require('fs');
const path = require('path');

const pendingPath = path.join(__dirname, '..', 'data', 'pending-videos.json');
const newVideosPath = path.join(__dirname, '..', 'data', 'new-videos.json');

function loadJSON(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch { return []; }
}

function main() {
  const pending = loadJSON(pendingPath);
  if (pending.length === 0) {
    console.log('No pending videos to retry.');
    return;
  }

  // Only retry videos older than 6 hours (give YouTube time to generate captions)
  const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
  const toRetry = pending.filter(p => new Date(p.date).getTime() < sixHoursAgo);
  const stillPending = pending.filter(p => new Date(p.date).getTime() >= sixHoursAgo);

  if (toRetry.length === 0) {
    console.log(`${pending.length} pending video(s) — all too recent to retry.`);
    return;
  }

  console.log(`Retrying ${toRetry.length} pending video(s)...`);

  // Write them as new-videos.json so process-new-video.js can pick them up
  fs.writeFileSync(newVideosPath, JSON.stringify(toRetry, null, 2), 'utf8');

  // Update pending list (remove retried ones)
  fs.writeFileSync(pendingPath, JSON.stringify(stillPending, null, 2), 'utf8');

  // Run process-new-video.js
  try {
    require('child_process').execSync('node process-new-video.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('Retry processing failed:', err.message);
    return;
  }

  // If any were processed, run update
  const processedPath = path.join(__dirname, '..', 'data', 'processed-recipes.json');
  if (fs.existsSync(processedPath)) {
    const processed = loadJSON(processedPath);
    if (processed.length > 0) {
      console.log(`Retried successfully: ${processed.length} recipe(s)`);
      require('child_process').execSync('node update-recipe-data.js', { cwd: __dirname, stdio: 'inherit' });
    }
  }
}

main();
