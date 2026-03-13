// Merge processed recipes into recipe-data.js + language files
// Reads from data/processed-recipes.json (output of process-new-video.js)
// Then regenerates Urdu + Marathi translations

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const recipeDataPath = path.join(__dirname, '..', 'frontend', 'js', 'recipe-data.js');
const hiPath = path.join(__dirname, '..', 'frontend', 'js', 'lang', 'hi.js');
const processedPath = path.join(__dirname, '..', 'data', 'processed-recipes.json');

// Escape strings for JS output
function esc(s) {
  if (!s) return '';
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function formatArr(arr, indent) {
  if (!arr || arr.length === 0) return '[]';
  return '[\n' + arr.map(item => `${indent}  "${esc(item)}"`).join(',\n') + `\n${indent}]`;
}

// Format a recipe as JS object string (matching merge-recipes.js format)
function formatRecipe(r) {
  return `  {
    id: "${r.id}",
    title: "${esc(r.title)}",
    titleHi: "${esc(r.titleHi)}",
    category: "${r.category}",
    views: ${r.views || 0},
    duration: "${r.duration || '0:00'}",
    servings: "${esc(r.servings)}",
    prepTime: "${esc(r.prepTime)}",
    cookTime: "${esc(r.cookTime)}",
    difficulty: "${esc(r.difficulty)}",
    description: "${esc(r.description)}",
    intro: "${esc(r.intro)}",
    ingredients: ${formatArr(r.ingredients, '    ')},
    method: ${formatArr(r.method, '    ')},
    outro: "${esc(r.outro)}",
    tips: ${formatArr(r.tips, '    ')}
  }`;
}

// Format a Hindi recipe entry
function formatHiRecipe(id, hi) {
  return `    "${id}": {
      title: "${esc(hi.title)}",
      description: "${esc(hi.description)}",
      intro: "${esc(hi.intro)}",
      ingredients: ${formatArr(hi.ingredients, '      ')},
      method: ${formatArr(hi.method, '      ')},
      outro: "${esc(hi.outro)}",
      tips: ${formatArr(hi.tips, '      ')}
    }`;
}

function main() {
  // Load processed recipes
  if (!fs.existsSync(processedPath)) {
    console.log('No processed-recipes.json found. Run process-new-video.js first.');
    process.exit(0);
  }

  const results = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
  if (results.length === 0) {
    console.log('No recipes to merge.');
    process.exit(0);
  }

  console.log(`Merging ${results.length} new recipe(s)...`);

  // --- 1. Update recipe-data.js ---
  let recipeContent = fs.readFileSync(recipeDataPath, 'utf8');

  // Get existing IDs to avoid duplicates
  const existingIds = new Set([...recipeContent.matchAll(/id: "([^"]+)"/g)].map(m => m[1]));

  const newRecipes = results.filter(r => !existingIds.has(r.recipe.id));
  if (newRecipes.length === 0) {
    console.log('All recipes already exist in recipe-data.js');
  } else {
    // Remove closing "];" and append
    recipeContent = recipeContent.trimEnd();
    if (recipeContent.endsWith('];')) {
      recipeContent = recipeContent.slice(0, -2).trimEnd();
      if (!recipeContent.endsWith(',')) recipeContent += ',';
    }

    const newStrings = newRecipes.map(r => formatRecipe(r.recipe)).join(',\n');
    recipeContent += '\n' + newStrings + '\n];';

    fs.writeFileSync(recipeDataPath, recipeContent, 'utf8');
    console.log(`Added ${newRecipes.length} recipe(s) to recipe-data.js`);
  }

  // --- 2. Update hi.js ---
  let hiContent = fs.readFileSync(hiPath, 'utf8');

  for (const result of newRecipes) {
    const { recipe, hi } = result;
    if (!hi) continue;

    // Check if already in hi.js
    if (hiContent.includes(`"${recipe.id}"`)) {
      console.log(`  ${recipe.id} already in hi.js`);
      continue;
    }

    // Insert before the closing `  }\n};`
    const hiEntry = formatHiRecipe(recipe.id, hi);
    const insertPoint = hiContent.lastIndexOf('  }\n};');
    if (insertPoint === -1) {
      console.error('Could not find insertion point in hi.js');
      continue;
    }

    hiContent = hiContent.slice(0, insertPoint) + '  },\n' + hiEntry + '\n  }\n};';
  }

  fs.writeFileSync(hiPath, hiContent, 'utf8');
  console.log('Updated hi.js');

  // --- 3. Regenerate Urdu + Marathi from hi.js ---
  console.log('Regenerating Urdu translations...');
  try {
    require('child_process').execSync('node hindi-to-urdu.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('Urdu generation failed:', err.message);
  }

  console.log('Regenerating Marathi translations...');
  try {
    require('child_process').execSync('node hindi-to-marathi.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('Marathi generation failed:', err.message);
  }

  // --- 4. Regenerate HTML pages ---
  console.log('Regenerating HTML pages...');
  try {
    require('child_process').execSync('node generate-pages.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (err) {
    console.error('Page generation failed:', err.message);
  }

  // Clean up processed file
  fs.unlinkSync(processedPath);

  console.log(`\nDone! ${newRecipes.length} new recipe(s) added to the site.`);
}

main();
