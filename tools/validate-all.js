const fs = require('fs');

// Validate recipe-data.js
let rd = fs.readFileSync('frontend/js/recipe-data.js', 'utf8');
rd = rd.replace('const recipes', 'var recipes');
eval(rd);
console.log('recipe-data.js: OK,', recipes.length, 'recipes');

const cats = {};
recipes.forEach(r => { cats[r.category] = (cats[r.category]||0) + 1; });
console.log('Categories:', JSON.stringify(cats));

// Validate hi.js
let hi = fs.readFileSync('frontend/js/lang/hi.js', 'utf8');
hi = hi.replace('const lang_hi', 'var lang_hi');
eval(hi);
console.log('hi.js: OK,', Object.keys(lang_hi.recipes).length, 'recipe translations');

const missing = recipes.filter(r => !lang_hi.recipes[r.id]);
console.log('Missing Hindi translations:', missing.length);

// Validate ur.js
let ur = fs.readFileSync('frontend/js/lang/ur.js', 'utf8');
ur = ur.replace('const lang_ur', 'var lang_ur');
eval(ur);
console.log('ur.js: OK, UI keys:', Object.keys(lang_ur.ui).length);

// Validate mr.js
let mr = fs.readFileSync('frontend/js/lang/mr.js', 'utf8');
mr = mr.replace('const lang_mr', 'var lang_mr');
eval(mr);
console.log('mr.js: OK, UI keys:', Object.keys(lang_mr.ui).length);

// Check for duplicate IDs
const ids = recipes.map(r => r.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log('Duplicate IDs:', dupes.length > 0 ? dupes.join(', ') : 'None');
