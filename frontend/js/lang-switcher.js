// ========== Language Switcher ==========

// Registry of available languages
const availableLanguages = [
  { code: 'en', name: 'English', dir: 'ltr' },
];

// Auto-register language files if they loaded
const langMap = {};
[
  typeof lang_hi !== 'undefined' ? lang_hi : null,
  typeof lang_ur !== 'undefined' ? lang_ur : null,
  typeof lang_bn !== 'undefined' ? lang_bn : null,
  typeof lang_ta !== 'undefined' ? lang_ta : null,
  typeof lang_te !== 'undefined' ? lang_te : null,
  typeof lang_mr !== 'undefined' ? lang_mr : null,
  typeof lang_gu !== 'undefined' ? lang_gu : null,
  typeof lang_kn !== 'undefined' ? lang_kn : null,
  typeof lang_ml !== 'undefined' ? lang_ml : null,
  typeof lang_pa !== 'undefined' ? lang_pa : null,
  typeof lang_ar !== 'undefined' ? lang_ar : null,
].forEach(lang => {
  if (lang && lang.code) {
    langMap[lang.code] = lang;
    availableLanguages.push({ code: lang.code, name: lang.name, dir: lang.dir || 'ltr' });
  }
});

// Current language state
let currentLang = localStorage.getItem('rz-lang') || 'en';
// Validate saved lang still exists
if (currentLang !== 'en' && !langMap[currentLang]) {
  currentLang = 'en';
}

// English UI defaults (used as fallback)
const uiDefaults = {
  ingredients: 'Ingredients',
  method: 'Step-by-Step Method',
  tips: "Rubina's Tips",
  prepTime: 'Prep',
  cookTime: 'Cook',
  servings: 'Servings',
  watchVideo: 'Watch Video',
  readRecipe: 'Read full recipe',
  loadMore: 'Load More',
  watchOnYoutube: 'Watch Full Recipe on YouTube',
};

// Get UI string for current language
function getUI(key) {
  if (currentLang === 'en') return uiDefaults[key] || key;
  const lang = langMap[currentLang];
  return (lang && lang.ui && lang.ui[key]) || uiDefaults[key] || key;
}

// Get translated recipe field, falling back to English
// context: 'modal' uses currentLang, 'card' always uses English
function getRecipeField(recipe, field, context) {
  const lang_code = (context === 'card') ? 'en' : currentLang;
  if (lang_code === 'en') return recipe[field];
  const lang = langMap[lang_code];
  if (lang && lang.recipes && lang.recipes[recipe.id]) {
    const translated = lang.recipes[recipe.id][field];
    if (translated !== undefined && translated !== null) {
      // For arrays, only use translation if it has content
      if (Array.isArray(translated) && translated.length > 0) return translated;
      if (!Array.isArray(translated) && translated !== '') return translated;
    }
  }
  return recipe[field]; // Fallback to English
}

// Apply current language to modal UI labels
function applyLangToModal() {
  const el = (id) => document.getElementById(id);
  if (el('modal-ingredients-heading')) el('modal-ingredients-heading').textContent = getUI('ingredients');
  if (el('modal-method-heading')) el('modal-method-heading').textContent = getUI('method');
  if (el('modal-tips-heading')) el('modal-tips-heading').textContent = getUI('tips');
  if (el('modal-prep-label')) el('modal-prep-label').textContent = getUI('prepTime');
  if (el('modal-cook-label')) el('modal-cook-label').textContent = getUI('cookTime');
  if (el('modal-servings-label')) el('modal-servings-label').textContent = getUI('servings');
  if (el('modal-yt-cta-text')) el('modal-yt-cta-text').textContent = getUI('watchOnYoutube');

  // Apply RTL/LTR to modal body
  const modalBody = el('modal-body');
  if (modalBody) {
    const dir = currentLang === 'en' ? 'ltr' : (langMap[currentLang]?.dir || 'ltr');
    modalBody.dir = dir;
  }
}

// Set language and update UI
function setLanguage(code) {
  if (code !== 'en' && !langMap[code]) return;
  currentLang = code;
  localStorage.setItem('rz-lang', code);

  // Update all selector button texts
  const langName = availableLanguages.find(l => l.code === code);
  const displayName = langName ? langName.name : 'English';
  ['lang-current-name', 'nav-lang-name', 'mobile-lang-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = displayName;
  });

  // Apply language to modal labels
  applyLangToModal();

  // Refresh all dropdowns
  renderLangOptions();
  renderNavLangOptions();
  renderMobileLangOptions();

  // If modal is open with a recipe, re-render it
  if (window._currentModalRecipe && !document.getElementById('recipe-modal').classList.contains('hidden')) {
    openModal(window._currentModalRecipe);
  }
}

// Render dropdown options (can be called multiple times safely)
function renderLangOptions() {
  const dropdown = document.getElementById('lang-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = availableLanguages.map(lang => `
    <button class="lang-option w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${lang.code === currentLang ? 'text-slate-900 font-semibold' : 'text-slate-500'}"
      data-lang="${lang.code}" dir="${lang.dir}">
      <span class="flex-1">${lang.name}</span>
      ${lang.code === currentLang ? '<svg class="w-3.5 h-3.5 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
    </button>
  `).join('');

  // Click handlers for language options
  dropdown.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      setLanguage(opt.dataset.lang);
      dropdown.classList.add('hidden');
      renderLangOptions(); // Refresh checkmarks
    });
  });

  // Update button text
  const current = availableLanguages.find(l => l.code === currentLang);
  const nameEl = document.getElementById('lang-current-name');
  if (nameEl) nameEl.textContent = current ? current.name : 'English';
}

// One-time setup for dropdown toggle and outside-click (no duplicates)
function initLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  const btn = document.getElementById('lang-selector-btn');
  if (!dropdown || !btn) return;

  renderLangOptions();

  // Toggle dropdown — bound once
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  // Close dropdown on outside click — bound once
  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}

// ========== Nav bar language dropdown ==========
function renderNavLangOptions() {
  const dropdown = document.getElementById('nav-lang-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = availableLanguages.map(lang => `
    <button class="nav-lang-option w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${lang.code === currentLang ? 'text-slate-900 font-semibold' : 'text-slate-500'}"
      data-lang="${lang.code}" dir="${lang.dir}">
      <span class="flex-1">${lang.name}</span>
      ${lang.code === currentLang ? '<svg class="w-3.5 h-3.5 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
    </button>
  `).join('');

  dropdown.querySelectorAll('.nav-lang-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      setLanguage(opt.dataset.lang);
      dropdown.classList.add('hidden');
    });
  });

  const nameEl = document.getElementById('nav-lang-name');
  const current = availableLanguages.find(l => l.code === currentLang);
  if (nameEl) nameEl.textContent = current ? current.name : 'English';
}

function initNavLangDropdown() {
  const dropdown = document.getElementById('nav-lang-dropdown');
  const btn = document.getElementById('nav-lang-btn');
  if (!dropdown || !btn) return;

  renderNavLangOptions();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    // Close mobile dropdown if open
    const mobileDd = document.getElementById('mobile-lang-dropdown');
    if (mobileDd) mobileDd.classList.add('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}

// ========== Mobile language dropdown ==========
function renderMobileLangOptions() {
  const dropdown = document.getElementById('mobile-lang-dropdown');
  if (!dropdown) return;

  dropdown.innerHTML = availableLanguages.map(lang => `
    <button class="mobile-lang-option w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${lang.code === currentLang ? 'text-slate-900 font-semibold' : 'text-slate-500'}"
      data-lang="${lang.code}" dir="${lang.dir}">
      <span class="flex-1">${lang.name}</span>
      ${lang.code === currentLang ? '<svg class="w-3.5 h-3.5 text-slate-900 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : ''}
    </button>
  `).join('');

  dropdown.querySelectorAll('.mobile-lang-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      setLanguage(opt.dataset.lang);
      dropdown.classList.add('hidden');
    });
  });

  const nameEl = document.getElementById('mobile-lang-name');
  const current = availableLanguages.find(l => l.code === currentLang);
  if (nameEl) nameEl.textContent = current ? current.name : 'English';
}

function initMobileLangDropdown() {
  const dropdown = document.getElementById('mobile-lang-dropdown');
  const btn = document.getElementById('mobile-lang-btn');
  if (!dropdown || !btn) return;

  renderMobileLangOptions();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
    // Close nav dropdown if open
    const navDd = document.getElementById('nav-lang-dropdown');
    if (navDd) navDd.classList.add('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });
}

// Initialize on load
initLangDropdown();
initNavLangDropdown();
initMobileLangDropdown();
