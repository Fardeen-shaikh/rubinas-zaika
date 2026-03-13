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
  if (match) { vm.runInContext('module.exports = ' + match[1], sandbox); return sandbox.module.exports; }
  return [];
}

const b4 = loadBatch('./tools/recipes-batch-4.js');

// Load recipe-data.js
let content = fs.readFileSync('frontend/js/recipe-data.js', 'utf8');
const modified = content.replace('const recipes', 'var recipes');
eval(modified);

// Replace batch 4 recipes
const b4ids = new Set(b4.map(r => r.id));
for (let i = 0; i < recipes.length; i++) {
  if (b4ids.has(recipes[i].id)) {
    recipes[i] = b4.find(r => r.id === recipes[i].id);
  }
}

// Write back
function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatArr(arr) {
  return arr.map(item => '      "' + esc(item) + '"').join(',\n');
}

function formatRecipe(r) {
  return `  {
    id: "${r.id}",
    title: "${esc(r.title)}",
    titleHi: "${r.titleHi}",
    category: "${r.category}",
    views: ${r.views},
    duration: "${r.duration}",
    servings: "${r.servings}",
    prepTime: "${r.prepTime}",
    cookTime: "${r.cookTime}",
    difficulty: "${r.difficulty}",
    description: "${esc(r.description)}",
    intro: "${esc(r.intro)}",
    ingredients: [
${formatArr(r.ingredients)}
    ],
    method: [
${formatArr(r.method)}
    ],
    outro: "${esc(r.outro)}",
    tips: [
${formatArr(r.tips)}
    ]
  }`;
}

const output = 'const recipes = [\n' + recipes.map(formatRecipe).join(',\n') + '\n];';
fs.writeFileSync('frontend/js/recipe-data.js', output, 'utf8');
console.log('Updated recipe-data.js with improved batch 4 data');
console.log('Total recipes:', recipes.length);
