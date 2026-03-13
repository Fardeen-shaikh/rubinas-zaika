// ========== Recipe Page Language Switcher ==========
// Shared script for individual recipe pages to enable language switching.
// Extracts video ID from the page, looks up translations, and swaps content.

(function () {
  // Extract video ID from first YouTube watch link on the page
  const ytLink = document.querySelector('a[href*="youtube.com/watch?v="]');
  if (!ytLink) return;
  const videoId = new URL(ytLink.href).searchParams.get('v');
  if (!videoId) return;

  // Build available languages list
  const rpLangs = [{ code: 'en', name: 'English', dir: 'ltr' }];
  const rpLangMap = {};
  [
    typeof lang_hi !== 'undefined' ? lang_hi : null,
    typeof lang_ur !== 'undefined' ? lang_ur : null,
    typeof lang_mr !== 'undefined' ? lang_mr : null,
    typeof lang_bn !== 'undefined' ? lang_bn : null,
    typeof lang_ta !== 'undefined' ? lang_ta : null,
    typeof lang_te !== 'undefined' ? lang_te : null,
    typeof lang_gu !== 'undefined' ? lang_gu : null,
    typeof lang_kn !== 'undefined' ? lang_kn : null,
    typeof lang_ml !== 'undefined' ? lang_ml : null,
    typeof lang_pa !== 'undefined' ? lang_pa : null,
    typeof lang_ar !== 'undefined' ? lang_ar : null,
  ].forEach(function (lang) {
    if (lang && lang.code) {
      rpLangMap[lang.code] = lang;
      rpLangs.push({ code: lang.code, name: lang.name, dir: lang.dir || 'ltr' });
    }
  });

  // If no translations loaded, don't show selector
  if (rpLangs.length <= 1) return;

  // Store original English content for reverting
  const originals = {};
  function storeOriginal(id, prop) {
    var el = document.getElementById(id);
    if (el) originals[id] = prop === 'innerHTML' ? el.innerHTML : el.textContent;
  }
  storeOriginal('rp-intro', 'text');
  storeOriginal('rp-ingredients', 'html');
  storeOriginal('rp-method', 'html');
  storeOriginal('rp-tips', 'html');
  storeOriginal('rp-outro', 'text');
  storeOriginal('rp-title', 'text');

  // Current language
  var curLang = localStorage.getItem('rz-lang') || 'en';
  if (curLang !== 'en' && !rpLangMap[curLang]) curLang = 'en';

  // UI label translations
  function getUILabel(key) {
    var defaults = {
      ingredients: 'Ingredients',
      method: 'Step-by-Step Method',
      tips: 'Tips',
      prepTime: 'Prep',
      cookTime: 'Cook',
      servings: 'Servings',
      watchOnYoutube: 'Watch Full Recipe on YouTube',
      watchVideo: 'Watch Video',
    };
    if (curLang === 'en') return defaults[key] || key;
    var lang = rpLangMap[curLang];
    return (lang && lang.ui && lang.ui[key]) || defaults[key] || key;
  }

  // Apply translation to the page
  function applyTranslation() {
    var recipe = null;
    if (curLang !== 'en') {
      var lang = rpLangMap[curLang];
      if (lang && lang.recipes && lang.recipes[videoId]) {
        recipe = lang.recipes[videoId];
      }
    }

    var dir = curLang === 'en' ? 'ltr' : (rpLangMap[curLang]?.dir || 'ltr');
    var article = document.querySelector('article');
    if (article) article.dir = dir;

    // Title
    var titleEl = document.getElementById('rp-title');
    if (titleEl) titleEl.textContent = (recipe && recipe.title) || originals['rp-title'] || titleEl.textContent;

    // Intro/description
    var introEl = document.getElementById('rp-intro');
    if (introEl) {
      var introText = (recipe && (recipe.intro || recipe.description)) || originals['rp-intro'];
      if (introText) introEl.textContent = introText;
    }

    // Ingredients
    var ingEl = document.getElementById('rp-ingredients');
    if (ingEl) {
      var ings = recipe && recipe.ingredients;
      if (ings && ings.length > 0) {
        ingEl.innerHTML = ings.map(function (ing) {
          return '<li class="py-1.5 text-stone-700 text-[15px] leading-relaxed">' + ing + '</li>';
        }).join('');
      } else if (originals['rp-ingredients']) {
        ingEl.innerHTML = originals['rp-ingredients'];
      }
    }

    // Method
    var methodEl = document.getElementById('rp-method');
    if (methodEl) {
      var steps = recipe && recipe.method;
      if (steps && steps.length > 0) {
        methodEl.innerHTML = steps.map(function (step, idx) {
          return '<li class="pb-3 text-stone-700 text-[15px] leading-relaxed"><span class="font-heading font-bold text-stone-900 mr-1">' + (idx + 1) + '.</span>' + step + '</li>';
        }).join('');
      } else if (originals['rp-method']) {
        methodEl.innerHTML = originals['rp-method'];
      }
    }

    // Tips
    var tipsEl = document.getElementById('rp-tips');
    if (tipsEl) {
      var tips = recipe && recipe.tips;
      if (tips && tips.length > 0) {
        tipsEl.innerHTML = tips.map(function (tip) {
          return '<li class="flex items-start gap-2 text-stone-600"><span class="text-amber-600 mt-0.5">*</span> ' + tip + '</li>';
        }).join('');
      } else if (originals['rp-tips']) {
        tipsEl.innerHTML = originals['rp-tips'];
      }
    }

    // Outro
    var outroEl = document.getElementById('rp-outro');
    if (outroEl) {
      var outroText = (recipe && recipe.outro) || originals['rp-outro'];
      if (outroText) outroEl.textContent = outroText;
    }

    // UI labels
    var ingHeading = document.getElementById('rp-ingredients-heading');
    if (ingHeading) ingHeading.textContent = getUILabel('ingredients');
    var methodHeading = document.getElementById('rp-method-heading');
    if (methodHeading) methodHeading.textContent = getUILabel('method');
    var tipsHeading = document.getElementById('rp-tips-heading');
    if (tipsHeading) tipsHeading.textContent = getUILabel('tips');
    var prepLabel = document.getElementById('rp-prep-label');
    if (prepLabel) prepLabel.textContent = getUILabel('prepTime');
    var cookLabel = document.getElementById('rp-cook-label');
    if (cookLabel) cookLabel.textContent = getUILabel('cookTime');
    var servingsLabel = document.getElementById('rp-servings-label');
    if (servingsLabel) servingsLabel.textContent = getUILabel('servings');
    var ytCta = document.getElementById('rp-yt-cta');
    if (ytCta) ytCta.textContent = getUILabel('watchOnYoutube');

    // Update dropdown checkmark
    renderDropdown();
  }

  // Inject language dropdown into the nav
  var nav = document.querySelector('nav .max-w-3xl');
  if (!nav) return;

  // Inject a <style> for the pulse animation
  var style = document.createElement('style');
  style.textContent =
    '@keyframes rp-lang-pulse{0%,100%{box-shadow:0 0 0 0 rgba(217,119,6,0.5)}50%{box-shadow:0 0 0 6px rgba(217,119,6,0)}}' +
    '.rp-lang-pulse{animation:rp-lang-pulse 1.5s ease-in-out 3}';
  document.head.appendChild(style);

  var langWrap = document.createElement('div');
  langWrap.style.cssText = 'position:relative;';
  langWrap.innerHTML =
    '<button id="rp-lang-btn" class="rp-lang-pulse" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;background:#fffbeb;color:#b45309;padding:6px 12px;border-radius:9999px;border:1px solid #fde68a;cursor:pointer;transition:background 0.2s;">' +
      '<svg style="width:16px;height:16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 3a15 15 0 014 9 15 15 0 01-4 9 15 15 0 01-4-9 15 15 0 014-9z"/></svg>' +
      '<span id="rp-lang-name">English</span>' +
      '<svg style="width:12px;height:12px;opacity:0.6;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>' +
    '</button>' +
    '<div id="rp-lang-dropdown" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#fff;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.12);border:1px solid #f5f5f4;padding:4px 0;min-width:140px;z-index:9999;max-height:240px;overflow-y:auto;"></div>';

  // Add hover effect to button
  var langBtn = langWrap.querySelector('#rp-lang-btn');
  langBtn.addEventListener('mouseover', function() { langBtn.style.background = '#fef3c7'; });
  langBtn.addEventListener('mouseout', function() { langBtn.style.background = '#fffbeb'; });

  // Insert before the YouTube button
  var ytBtn = nav.querySelector('a[href*="youtube.com"]');
  if (ytBtn) {
    nav.insertBefore(langWrap, ytBtn);
  } else {
    nav.appendChild(langWrap);
  }

  function renderDropdown() {
    var dropdown = document.getElementById('rp-lang-dropdown');
    if (!dropdown) return;
    dropdown.innerHTML = rpLangs.map(function (lang) {
      var active = lang.code === curLang;
      return '<button class="rp-lang-opt" style="display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:6px 12px;font-size:14px;border:none;background:none;cursor:pointer;transition:background 0.15s;' +
        (active ? 'color:#1c1917;font-weight:600;' : 'color:#78716c;') +
        '" data-lang="' + lang.code + '" onmouseover="this.style.background=\'#fafaf9\'" onmouseout="this.style.background=\'none\'">' +
        '<span style="flex:1;">' + lang.name + '</span>' +
        (active ? '<svg style="width:12px;height:12px;color:#1c1917;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>' : '') +
        '</button>';
    }).join('');

    dropdown.querySelectorAll('.rp-lang-opt').forEach(function (opt) {
      opt.addEventListener('click', function (e) {
        e.stopPropagation();
        curLang = opt.dataset.lang;
        localStorage.setItem('rz-lang', curLang);
        dropdown.style.display = 'none';
        applyTranslation();
      });
    });

    var nameEl = document.getElementById('rp-lang-name');
    var current = rpLangs.find(function (l) { return l.code === curLang; });
    if (nameEl) nameEl.textContent = current ? current.name : 'English';
  }

  // Toggle dropdown
  document.getElementById('rp-lang-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    var dd = document.getElementById('rp-lang-dropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', function () {
    var dd = document.getElementById('rp-lang-dropdown');
    if (dd) dd.style.display = 'none';
  });

  // Render and apply saved language
  renderDropdown();
  if (curLang !== 'en') applyTranslation();
})();
