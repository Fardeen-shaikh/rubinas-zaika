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
  greeting: 'Assalamu Alaikum',
  heroTitle: 'What would you\nlike to cook today?',
  heroSubtitle: 'Explore 93+ homemade Indian recipes with step-by-step video guides.',
  browseRecipes: 'Browse Recipes',
  featuredRecipes: 'Featured Recipes',
  whyCookWithUs: 'Why Cook With Us?',
  recipesCount: '93+ Recipes',
  recipesCountDesc: 'Growing collection of homemade dishes',
  videoGuides: 'Video Guides',
  videoGuidesDesc: 'Step-by-step YouTube tutorials',
  easyToFollow: 'Easy to Follow',
  easyToFollowDesc: 'Simple ingredients, clear instructions',
  allSkillLevels: 'All Skill Levels',
  allSkillLevelsDesc: 'From beginners to home chefs',
  allRecipes: 'All Recipes',
  ourChannel: 'Our Channel',
  subscribers: 'Subscribers',
  videos: 'Videos',
  views: 'Views',
  nonveg: 'Non-Veg',
  veg: 'Veg',
  snacks: 'Snacks',
  sweets: 'Sweets',
  maincourse: 'Main Course',
  breakfast: 'Breakfast',
  chutney: 'Chutney',
  searchPlaceholder: 'Search recipes...',
  subscribe: 'Subscribe',
  quickLinks: 'Quick Links',
  categories: 'Categories',
  home: 'Home',
  recipes: 'Recipes',
  contact: 'Contact',
  brandDesc: 'Where the love for food meets the warmth of home cooking. Sharing simple homemade recipes from our family kitchen.',
  followUs: 'Follow us',
  allRecipesSubtitle: 'Handpicked from our kitchen to yours',
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

  // Apply homepage translation
  applyHomepageTranslation();

  // Re-render recipe cards and featured slideshow with new language
  if (typeof renderCards === 'function') renderCards();
  if (typeof refreshFeaturedSlideshow === 'function') refreshFeaturedSlideshow();

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

// ========== Homepage translation ==========
const hpDefaults = {};
function storeHpOriginal(id) {
  const el = document.getElementById(id);
  if (el) hpDefaults[id] = el.innerHTML;
}

// Store originals on first load
[
  'hp-greeting', 'hp-hero-title', 'hp-hero-subtitle', 'hp-browse-btn',
  'hp-our-channel', 'hp-subscribers-label', 'hp-videos-label', 'hp-views-label',
  'hp-cat-nonveg', 'hp-cat-veg', 'hp-cat-sweets', 'hp-cat-snacks',
  'hp-cat-maincourse', 'hp-cat-breakfast', 'hp-cat-chutney',
  'hp-featured-heading', 'hp-whycook-heading',
  'hp-feat-recipes', 'hp-feat-recipes-desc', 'hp-feat-video', 'hp-feat-video-desc',
  'hp-feat-easy', 'hp-feat-easy-desc', 'hp-feat-all', 'hp-feat-all-desc',
  'hp-all-recipes-heading',
  'ft-brand-desc', 'ft-quick-links', 'ft-link-home', 'ft-link-recipes', 'ft-link-contact',
  'ft-categories', 'ft-cat-nonveg', 'ft-cat-snacks', 'ft-cat-maincourse',
  'ft-cat-sweets', 'ft-cat-breakfast', 'ft-cat-chutney',
  'ft-our-channel', 'ft-subscribers', 'ft-videos', 'ft-views', 'ft-subscribe-text',
  'hp-all-recipes-subtitle'
].forEach(storeHpOriginal);

function applyHomepageTranslation() {
  const t = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    const translated = getUI(key);
    // If getUI returns the key itself (no translation), fall back to original
    if (translated === key) {
      if (hpDefaults[id]) el.innerHTML = hpDefaults[id];
    } else {
      el.textContent = translated;
    }
  };

  t('hp-greeting', 'greeting');
  t('hp-hero-subtitle', 'heroSubtitle');
  t('hp-browse-btn', 'browseRecipes');
  t('hp-our-channel', 'ourChannel');
  t('hp-subscribers-label', 'subscribers');
  t('hp-videos-label', 'videos');
  t('hp-views-label', 'views');
  t('hp-featured-heading', 'featuredRecipes');
  t('hp-whycook-heading', 'whyCookWithUs');
  t('hp-feat-recipes', 'recipesCount');
  t('hp-feat-recipes-desc', 'recipesCountDesc');
  t('hp-feat-video', 'videoGuides');
  t('hp-feat-video-desc', 'videoGuidesDesc');
  t('hp-feat-easy', 'easyToFollow');
  t('hp-feat-easy-desc', 'easyToFollowDesc');
  t('hp-feat-all', 'allSkillLevels');
  t('hp-feat-all-desc', 'allSkillLevelsDesc');
  t('hp-all-recipes-heading', 'allRecipes');
  t('hp-all-recipes-subtitle', 'allRecipesSubtitle');

  // Category names
  t('hp-cat-nonveg', 'nonveg');
  t('hp-cat-veg', 'veg');
  t('hp-cat-sweets', 'sweets');
  t('hp-cat-snacks', 'snacks');
  t('hp-cat-maincourse', 'maincourse');
  t('hp-cat-breakfast', 'breakfast');
  t('hp-cat-chutney', 'chutney');

  // Hero title needs innerHTML for <br>
  const titleEl = document.getElementById('hp-hero-title');
  if (titleEl) {
    const titleText = getUI('heroTitle');
    if (titleText !== 'heroTitle') {
      titleEl.innerHTML = titleText.replace(/\n/g, '<br>');
    } else if (hpDefaults['hp-hero-title']) {
      titleEl.innerHTML = hpDefaults['hp-hero-title'];
    }
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const filter = btn.dataset.filter;
    if (!filter) return;
    const map = { all: 'All', veg: 'veg', nonveg: 'nonveg', snacks: 'snacks', sweets: 'sweets', maincourse: 'maincourse', breakfast: 'breakfast', chutney: 'chutney' };
    if (filter === 'all') {
      btn.textContent = currentLang === 'en' ? 'All' : (getUI('all') !== 'all' ? getUI('all') : 'All');
    } else if (map[filter]) {
      const translated = getUI(filter);
      btn.textContent = translated !== filter ? translated : (filter === 'maincourse' ? 'Main Course' : filter.charAt(0).toUpperCase() + filter.slice(1));
    }
  });

  // Search placeholder
  const searchInput = document.getElementById('recipe-search');
  if (searchInput) {
    const placeholder = getUI('searchPlaceholder');
    if (placeholder !== 'searchPlaceholder') searchInput.placeholder = placeholder;
    else searchInput.placeholder = 'Search recipes...';
  }

  // Footer
  t('ft-brand-desc', 'brandDesc');
  t('ft-quick-links', 'quickLinks');
  t('ft-link-home', 'home');
  t('ft-link-recipes', 'recipes');
  t('ft-link-contact', 'contact');
  t('ft-categories', 'categories');
  t('ft-cat-nonveg', 'nonveg');
  t('ft-cat-snacks', 'snacks');
  t('ft-cat-maincourse', 'maincourse');
  t('ft-cat-sweets', 'sweets');
  t('ft-cat-breakfast', 'breakfast');
  t('ft-cat-chutney', 'chutney');
  t('ft-our-channel', 'ourChannel');
  t('ft-subscribers', 'subscribers');
  t('ft-videos', 'videos');
  t('ft-views', 'views');
  t('ft-subscribe-text', 'subscribe');
}

// Initialize on load
initLangDropdown();
initNavLangDropdown();
initMobileLangDropdown();

// Apply homepage translation on load if not English
if (currentLang !== 'en') {
  applyHomepageTranslation();
}
