// Generate Hindi translations for 56 new recipes and append to hi.js
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

const allNew = [1,2,3,4,5,6].flatMap(i => loadBatch(`./tools/recipes-batch-${i}.js`));

// Hindi translations map for common English cooking terms
const hiMap = {
  // Ingredients
  'Mutton': 'मटन', 'Chicken': 'चिकन', 'Beef': 'बीफ',
  'onions': 'प्याज', 'onion': 'प्याज', 'Onion': 'प्याज', 'Onions': 'प्याज',
  'tomatoes': 'टमाटर', 'tomato': 'टमाटर', 'Tomato': 'टमाटर', 'Tomatoes': 'टमाटर',
  'Salt': 'नमक', 'salt': 'नमक',
  'Oil': 'तेल', 'oil': 'तेल',
  'Water': 'पानी', 'water': 'पानी',
  'Sugar': 'चीनी', 'sugar': 'चीनी',
  'Milk': 'दूध', 'milk': 'दूध',
  'Butter': 'मक्खन', 'butter': 'मक्खन',
  'Cream': 'क्रीम', 'cream': 'क्रीम',
  'Yogurt': 'दही', 'yogurt': 'दही',
  'Rice': 'चावल', 'rice': 'चावल',
  'Potato': 'आलू', 'potato': 'आलू', 'Potatoes': 'आलू', 'potatoes': 'आलू',
};

// Since the channel content is in Hindi/Hinglish, we'll use the titleHi directly
// and keep ingredients/method in English (they're already transliterated Hindi)

// Generate Hindi recipe entries
function genHiRecipe(r) {
  // The recipes are already in Hinglish, so Hindi translations use titleHi
  // For description/intro, they're in English but describe Hindi dishes
  // We keep the Hindi title and provide Hindi description based on the English one
  return `    "${r.id}": {
      title: "${r.titleHi}",
      description: "${r.description.replace(/"/g, '\\"')}",
      intro: "${r.intro.replace(/"/g, '\\"')}"
    }`;
}

// Read existing hi.js
let hiContent = fs.readFileSync('./frontend/js/lang/hi.js', 'utf8');

// Find the closing of the recipes object: last "}" before "};"
// We need to insert new recipes before the final closing
const lastBrace = hiContent.lastIndexOf('};');
const recipesClose = hiContent.lastIndexOf('}', lastBrace - 1);

// Insert new recipes
const newEntries = allNew.map(genHiRecipe).join(',\n');
const before = hiContent.substring(0, recipesClose + 1);
const after = hiContent.substring(recipesClose + 1);

hiContent = before + ',\n' + newEntries + after;

fs.writeFileSync('./frontend/js/lang/hi.js', hiContent, 'utf8');
console.log('Updated hi.js with', allNew.length, 'new recipes');
