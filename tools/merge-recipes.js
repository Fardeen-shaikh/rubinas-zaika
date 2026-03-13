const fs = require('fs');
const vm = require('vm');

function loadBatch(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const exp = sandbox.module.exports;
  if (Array.isArray(exp)) return exp;
  const match = code.match(/const (\w+) = \[/);
  if (match) {
    vm.runInContext('module.exports = ' + match[1], sandbox);
    return sandbox.module.exports;
  }
  return [];
}

// Load all batches
const allNew = [1,2,3,4,5,6].flatMap(i => loadBatch(`./recipes-batch-${i}.js`));

// Read existing recipe-data.js
const recipeFile = '../frontend/js/recipe-data.js';
let content = fs.readFileSync(recipeFile, 'utf8');

// Get existing IDs
const existingIds = new Set([...content.matchAll(/id: "([^"]+)"/g)].map(m => m[1]));
console.log('Existing recipes:', existingIds.size);

// Filter duplicates
const newRecipes = allNew.filter(r => !existingIds.has(r.id));
console.log('New recipes to add:', newRecipes.length);

if (newRecipes.length === 0) {
  console.log('Nothing to merge.');
  process.exit(0);
}

// Format each recipe as JS object string
function formatRecipe(r) {
  const formatArr = (arr) => arr.map(item => `      "${item.replace(/"/g, '\\"')}"`).join(',\n');
  
  return `  {
    id: "${r.id}",
    title: "${r.title.replace(/"/g, '\\"')}",
    titleHi: "${r.titleHi}",
    category: "${r.category}",
    views: ${r.views},
    duration: "${r.duration}",
    servings: "${r.servings}",
    prepTime: "${r.prepTime}",
    cookTime: "${r.cookTime}",
    difficulty: "${r.difficulty}",
    description: "${r.description.replace(/"/g, '\\"')}",
    intro: "${r.intro.replace(/"/g, '\\"')}",
    ingredients: [
${formatArr(r.ingredients)}
    ],
    method: [
${formatArr(r.method)}
    ],
    outro: "${r.outro.replace(/"/g, '\\"')}",
    tips: [
${formatArr(r.tips)}
    ]
  }`;
}

// Remove the closing "];" and append new recipes
content = content.trimEnd();
if (content.endsWith('];')) {
  content = content.slice(0, -2).trimEnd();
  // Add comma after last existing recipe
  if (!content.endsWith(',')) {
    content += ',';
  }
} else if (content.endsWith(']')) {
  content = content.slice(0, -1).trimEnd();
  if (!content.endsWith(',')) {
    content += ',';
  }
}

// Append new recipes
const newRecipeStrings = newRecipes.map(formatRecipe).join(',\n');
content += '\n' + newRecipeStrings + '\n];';

fs.writeFileSync(recipeFile, content, 'utf8');
console.log('Done! Total recipes now:', existingIds.size + newRecipes.length);
