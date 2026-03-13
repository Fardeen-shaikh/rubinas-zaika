// ========== Initialize AOS ==========
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
AOS.init({
  duration: prefersReducedMotion ? 0 : 600,
  easing: 'ease-out-cubic',
  once: true,
  offset: 40,
  disable: prefersReducedMotion,
});

// ========== Navbar Scroll ==========
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('nav-scrolled', window.scrollY > 40);
});

// ========== Mobile Menu ==========
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
  const isOpen = !mobileMenu.classList.contains('hidden');
  mobileMenu.classList.toggle('hidden');
  menuToggle.classList.toggle('menu-open', !isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
});

document.querySelectorAll('.mobile-nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuToggle.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

// ========== Active Nav Highlight ==========
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('text-heading', link.getAttribute('href') === `#${id}`);
        link.classList.toggle('font-semibold', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-20% 0px -80% 0px', threshold: 0 });

sections.forEach(section => observer.observe(section));

// ========== RECIPE ENGINE ==========
recipes.sort((a, b) => b.views - a.views);

const categoryColors = {
  veg: { bg: 'bg-green-50 text-green-700', label: 'Veg', emoji: '🥬', title: 'Veg Recipes' },
  nonveg: { bg: 'bg-red-50 text-red-700', label: 'Non-Veg', emoji: '🍗', title: 'Non-Veg Recipes' },
  snacks: { bg: 'bg-amber-50 text-amber-700', label: 'Snacks', emoji: '🥘', title: 'Snack Recipes' },
  sweets: { bg: 'bg-pink-50 text-pink-700', label: 'Sweets', emoji: '🍮', title: 'Sweet Recipes' },
  maincourse: { bg: 'bg-emerald-50 text-emerald-700', label: 'Main Course', emoji: '🍛', title: 'Main Course Recipes' },
  breakfast: { bg: 'bg-yellow-50 text-yellow-700', label: 'Breakfast', emoji: '🥞', title: 'Breakfast Recipes' },
  chutney: { bg: 'bg-lime-50 text-lime-700', label: 'Chutney', emoji: '🫙', title: 'Chutney Recipes' },
};

// ========== Category Page Detection ==========
const urlParams = new URLSearchParams(window.location.search);
const catParam = urlParams.get('cat');
const isCategoryPage = !!catParam && !!categoryColors[catParam];

// Redirect invalid category params
if (catParam && !categoryColors[catParam] && document.getElementById('cat-title')) {
  window.location.href = 'index.html';
}

// Populate category page hero
if (isCategoryPage) {
  const catInfo = categoryColors[catParam];
  const catEmojiEl = document.getElementById('cat-emoji');
  const catTitleEl = document.getElementById('cat-title');
  const catCountEl = document.getElementById('cat-count');
  const pageTitleEl = document.getElementById('page-title');
  const pageDescEl = document.getElementById('page-desc');

  if (catEmojiEl) catEmojiEl.textContent = catInfo.emoji;
  if (catTitleEl) catTitleEl.textContent = catInfo.title;
  if (pageTitleEl) pageTitleEl.textContent = `${catInfo.title} — Rubina's Zaika`;
  if (pageDescEl) pageDescEl.content = `Browse ${catInfo.label} recipes from Rubina's Zaika — simple homemade Indian recipes with step-by-step YouTube videos.`;

  // Count recipes for this category
  const count = catParam === 'veg'
    ? recipes.filter(r => r.category !== 'nonveg').length
    : recipes.filter(r => r.category === catParam).length;
  if (catCountEl) catCountEl.textContent = `${count} recipes`;

  // Highlight active pill
  document.querySelectorAll('#category-pills a[data-cat]').forEach(pill => {
    if (pill.dataset.cat === catParam) {
      pill.classList.add('bg-primary', 'text-white', 'border-primary');
      pill.classList.remove('bg-white', 'text-body-text');
    }
  });
}

const recipeGrid = document.getElementById('recipe-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadMoreWrap = document.getElementById('load-more-wrap');
const searchInput = document.getElementById('recipe-search');
let currentFilter = isCategoryPage ? catParam : 'all';
let searchQuery = '';
let visibleCount = 6;

function formatViews(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// ========== Category Counts ==========
function renderCategoryCounts() {
  const counts = {
    nonveg: recipes.filter(r => r.category === 'nonveg').length,
    veg: recipes.filter(r => r.category !== 'nonveg').length,
    sweets: recipes.filter(r => r.category === 'sweets').length,
    snacks: recipes.filter(r => r.category === 'snacks').length,
  };
  Object.entries(counts).forEach(([cat, count]) => {
    const el = document.getElementById('cat-count-' + cat);
    if (el) el.textContent = count + ' recipes';
  });
}

// ========== Filtered Recipes ==========
function getFilteredRecipes() {
  let filtered;
  if (currentFilter === 'all') filtered = recipes;
  else if (currentFilter === 'veg') filtered = recipes.filter(r => r.category !== 'nonveg');
  else filtered = recipes.filter(r => r.category === currentFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.titleHi && r.titleHi.includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  }
  return filtered;
}

function renderCards() {
  const filtered = getFilteredRecipes();
  const toShow = filtered.slice(0, visibleCount);
  recipeGrid.innerHTML = '';

  if (filtered.length === 0) {
    recipeGrid.innerHTML = `
      <div class="col-span-full text-center py-16 text-muted-text">
        <p class="text-base font-semibold mb-1">No recipes found</p>
        <p class="text-sm">Try a different search or category.</p>
      </div>`;
    loadMoreWrap.classList.add('hidden');
    return;
  }

  toShow.forEach((recipe, i) => {
    const cat = categoryColors[recipe.category] || categoryColors.snacks;
    const title = (typeof getRecipeField === 'function') ? getRecipeField(recipe, 'title', 'card') : recipe.title;
    const desc = (typeof getRecipeField === 'function') ? getRecipeField(recipe, 'description', 'card') : recipe.description;

    const card = document.createElement('div');
    card.className = 'recipe-card-item group rounded-xl overflow-hidden cursor-pointer';
    card.style.animationDelay = `${(i % 3) * 50}ms`;
    card.innerHTML = `
      <div class="relative overflow-hidden" style="aspect-ratio:16/10;">
        <img src="https://i.ytimg.com/vi/${recipe.id}/maxresdefault.jpg" alt="${title}"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
          onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${recipe.id}/hqdefault.jpg';this.style.transform='scale(1.2)'">
        <div class="absolute top-2 left-2">
          <span class="${cat.bg} text-[10px] font-semibold px-2 py-0.5 rounded">${cat.label}</span>
        </div>
        <div class="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          ${recipe.duration}
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-sm text-heading mb-1.5 group-hover:text-primary transition-colors line-clamp-1">${title}</h3>
        <p class="text-muted-text text-xs leading-relaxed mb-2.5 line-clamp-2">${desc}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-[11px] text-muted-text">
            <span>${recipe.ingredients ? recipe.ingredients.length : '?'} ingredients</span>
            <span class="w-0.5 h-0.5 rounded-full bg-warm-border"></span>
            <span>${recipe.difficulty || 'Easy'}</span>
            <span class="w-0.5 h-0.5 rounded-full bg-warm-border"></span>
            <span>${formatViews(recipe.views)} views</span>
          </div>
          <span class="text-primary text-[11px] font-semibold group-hover:underline">View →</span>
        </div>
      </div>
    `;

    // Add favorite button and blur-up
    const imgEl = card.querySelector('img');
    if (imgEl) setupBlurUp(imgEl);
    const thumbDiv = card.querySelector('.relative');
    if (thumbDiv) thumbDiv.appendChild(createFavBtn(recipe.id));

    card.addEventListener('click', () => {
      if (typeof recipeSlugMap !== 'undefined' && recipeSlugMap[recipe.id]) {
        window.location.href = 'recipes/' + recipeSlugMap[recipe.id] + '.html';
      } else {
        openModal(recipe);
      }
    });
    recipeGrid.appendChild(card);
  });

  if (filtered.length > visibleCount) {
    loadMoreWrap.classList.remove('hidden');
    const remaining = filtered.length - visibleCount;
    const loadMoreText = (typeof getUI === 'function') ? getUI('loadMore') : 'Load More';
    loadMoreBtn.textContent = `${loadMoreText} (${remaining} more)`;
  } else {
    loadMoreWrap.classList.add('hidden');
  }
}

// ========== Search ==========
if (searchInput) {
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      visibleCount = 6;
      renderCards();
    }, 250);
  });
}

// ========== Filters ==========
function applyFilter(category) {
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active', 'bg-primary', 'text-white');
    b.classList.add('bg-white', 'text-body-text');
    b.setAttribute('aria-pressed', 'false');
    if (b.dataset.filter === category) {
      b.classList.add('active', 'bg-primary', 'text-white');
      b.classList.remove('bg-white', 'text-body-text');
      b.setAttribute('aria-pressed', 'true');
    }
  });
  currentFilter = category;
  visibleCount = 6;
  renderCards();
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
});

// ========== Hero Category Buttons ==========
// Now <a> links to category.html?cat=X — no JS needed

// ========== Footer Category Links ==========
// Now <a> links to category.html?cat=X — no JS needed

// ========== Load More ==========
if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    visibleCount += 6;
    renderCards();
  });
}

// ========== Modal ==========
const modal = document.getElementById('recipe-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

function openModal(recipe) {
  window._currentModalRecipe = recipe;
  const cat = categoryColors[recipe.category] || categoryColors.snacks;
  const ytUrl = `https://www.youtube.com/watch?v=${recipe.id}`;
  const t = (field) => (typeof getRecipeField === 'function') ? getRecipeField(recipe, field) : recipe[field];

  const title = t('title');
  const intro = t('intro');
  const description = t('description');
  const ingredients = t('ingredients') || [];
  const method = t('method') || [];
  const tips = t('tips') || [];
  const outro = t('outro');

  document.getElementById('modal-title').textContent = title;

  const watchText = (typeof getUI === 'function') ? getUI('watchVideo') : 'Watch on YouTube';
  document.getElementById('modal-hero').innerHTML = `
    <a href="${ytUrl}" target="_blank" rel="noopener" class="block relative w-full h-full group/play">
      <img src="https://i.ytimg.com/vi/${recipe.id}/maxresdefault.jpg" alt="${title}"
        class="w-full h-full object-cover"
        onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${recipe.id}/hqdefault.jpg'">
      <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="w-12 h-12 bg-red-600/90 rounded-lg flex items-center justify-center shadow-lg group-hover/play:scale-110 transition-transform">
          <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="absolute bottom-3 left-4">
        <span class="text-white/60 text-sm">${watchText}</span>
      </div>
    </a>
  `;

  document.getElementById('modal-yt-link').href = ytUrl;
  document.getElementById('modal-yt-link-top').href = ytUrl;

  const modalCategory = document.getElementById('modal-category');
  modalCategory.textContent = cat.label;
  modalCategory.className = `text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${cat.bg}`;

  document.getElementById('modal-views').textContent = `${formatViews(recipe.views)} views`;
  document.getElementById('modal-duration').textContent = recipe.duration;
  document.getElementById('modal-difficulty').textContent = recipe.difficulty ? `${recipe.difficulty}` : '';

  document.getElementById('modal-prep').textContent = recipe.prepTime || '-';
  document.getElementById('modal-cook').textContent = recipe.cookTime || '-';
  document.getElementById('modal-servings').textContent = recipe.servings || '-';

  document.getElementById('modal-description-text').textContent = intro || description || '';

  document.getElementById('modal-ingredients-list').innerHTML = ingredients.map(ing =>
    `<li class="flex items-start gap-3 py-1.5">
      <svg class="w-4 h-4 text-primary/40 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      <span class="text-body-text text-sm">${ing}</span>
    </li>`
  ).join('');

  document.getElementById('modal-method-list').innerHTML = method.map((step, idx) =>
    `<li class="flex items-start gap-4 pb-4 ${idx < method.length - 1 ? 'border-b border-warm-border' : ''}">
      <span class="w-6 h-6 rounded bg-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-semibold">${idx + 1}</span>
      <span class="text-body-text leading-relaxed pt-0.5 text-sm">${step}</span>
    </li>`
  ).join('');

  const tipsSection = document.getElementById('modal-tips-section');
  if (tips && tips.length > 0) {
    tipsSection.classList.remove('hidden');
    document.getElementById('modal-tips-list').innerHTML = tips.map(tip =>
      `<li class="flex items-start gap-2 text-body-text text-sm">
        <span class="text-spice mt-0.5 flex-shrink-0">*</span>
        <span>${tip}</span>
      </li>`
    ).join('');
  } else {
    tipsSection.classList.add('hidden');
  }

  const outroSection = document.getElementById('modal-outro-section');
  if (outro) {
    outroSection.classList.remove('hidden');
    document.getElementById('modal-outro-text').textContent = outro;
  } else {
    outroSection.classList.add('hidden');
  }

  if (typeof applyLangToModal === 'function') applyLangToModal();

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal-body').scrollTop = 0;
}

function closeModal() {
  modal.classList.add('hidden');
  document.body.style.overflow = '';
  document.getElementById('modal-hero').innerHTML = '';
  window._currentModalRecipe = null;
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ========== Scroll Progress Bar ==========
const scrollProgress = document.getElementById('scroll-progress');
if (scrollProgress) {
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    scrollProgress.style.width = progress + '%';
  });
}

// ========== Back to Top ==========
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== Dark Mode Toggle ==========
const darkToggle = document.getElementById('dark-toggle');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

function updateDarkIcons() {
  const isDark = document.documentElement.classList.contains('dark');
  if (iconSun && iconMoon) {
    iconSun.classList.toggle('hidden', !isDark);
    iconMoon.classList.toggle('hidden', isDark);
  }
}
updateDarkIcons();

if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateDarkIcons();
  });
}

// ========== Toast ==========
function showToast(message, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ========== Share Recipe ==========
function shareRecipe(method) {
  const recipe = window._currentModalRecipe;
  if (!recipe) return;
  const url = `https://www.youtube.com/watch?v=${recipe.id}`;
  const title = recipe.title;

  if (method === 'copy') {
    navigator.clipboard.writeText(url).then(() => showToast('Link copied!')).catch(() => showToast('Could not copy'));
  } else if (method === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(title + ' - ' + url)}`, '_blank');
  } else if (method === 'native' && navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  }
}
window.shareRecipe = shareRecipe;

// Show native share button if supported
if (navigator.share) {
  const nativeBtn = document.getElementById('share-native');
  if (nativeBtn) nativeBtn.style.display = '';
}

// ========== Favorites ==========
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
}
function toggleFavorite(recipeId, btn) {
  let favs = getFavorites();
  const idx = favs.indexOf(recipeId);
  if (idx > -1) { favs.splice(idx, 1); btn.classList.remove('active'); }
  else { favs.push(recipeId); btn.classList.add('active'); }
  localStorage.setItem('favorites', JSON.stringify(favs));
  btn.classList.add('pop');
  setTimeout(() => btn.classList.remove('pop'), 350);
}

function createFavBtn(recipeId) {
  const btn = document.createElement('button');
  btn.className = 'fav-btn' + (getFavorites().includes(recipeId) ? ' active' : '');
  btn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>`;
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(recipeId, btn); });
  return btn;
}

// ========== Blur-Up Image Helper ==========
function setupBlurUp(img) {
  img.classList.add('blur-up');
  if (img.complete) { img.classList.add('loaded'); }
  else { img.addEventListener('load', () => img.classList.add('loaded')); }
}

// ========== Animated Stat Counters ==========
function animateCounter(el, target, suffix = '') {
  const duration = 1500;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = Math.floor(ease * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.countSuffix || '';
        animateCounter(el, target, suffix);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ========== Featured Recipe Slideshow (Long Videos Only) ==========
function initFeaturedSlideshow() {
  const grid = document.getElementById('featured-grid');
  if (!grid || isCategoryPage) return;

  const catLabels = { nonveg: 'Non-Veg', snacks: 'Snacks', sweets: 'Sweets', veg: 'Veg', drinks: 'Drinks', tips: 'Tips' };

  // Filter long videos only (duration > 3 minutes, not shorts)
  const longVideos = recipes.filter(r => {
    if (!r.duration) return false;
    const parts = r.duration.split(':');
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1] || '0', 10);
    const totalSecs = mins * 60 + secs;
    return totalSecs > 180; // strictly more than 3:00
  });

  if (longVideos.length < 3) return;

  let lastShown = [];
  let autoTimer = null;

  // Pick 3 random recipes, avoiding repeats from last slide
  function pickRandom3() {
    const pool = longVideos.filter(r => !lastShown.includes(r.id));
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);
    lastShown = picked.map(r => r.id);
    return picked;
  }

  function buildCard(recipe, idx) {
    const card = document.createElement('div');
    card.className = 'featured-recipe magnetic-card relative rounded-2xl overflow-hidden group aspect-video cursor-pointer' +
      (idx === 2 ? ' col-span-2 lg:col-span-1' : '');
    card.dataset.id = recipe.id;
    card.innerHTML =
      '<img src="https://i.ytimg.com/vi/' + recipe.id + '/hqdefault.jpg" alt="' + recipe.title.replace(/"/g, '&quot;') + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">' +
      '<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>' +
      '<div class="absolute bottom-3 left-3.5 right-3.5">' +
        '<h3 class="text-white font-display font-bold text-sm sm:text-base drop-shadow-lg">' + recipe.title + '</h3>' +
        '<p class="text-white/70 text-[11px] mt-0.5">' + (catLabels[recipe.category] || recipe.category) + ' · ' + recipe.duration + '</p>' +
      '</div>';
    card.addEventListener('click', () => {
      if (typeof recipeSlugMap !== 'undefined' && recipeSlugMap[recipe.id]) {
        window.location.href = 'recipes/' + recipeSlugMap[recipe.id] + '.html';
      } else {
        openModal(recipe);
      }
    });
    return card;
  }

  function renderSlide(recipesToShow) {
    var gridRect = grid.getBoundingClientRect();
    var centerX = gridRect.width / 2;

    // Phase 1: Old cards gather to center, rotate like a shuffling deck
    var oldCards = Array.from(grid.querySelectorAll('.featured-recipe'));
    oldCards.forEach(function(c, i) {
      var cardRect = c.getBoundingClientRect();
      var offsetX = centerX - (cardRect.left - gridRect.left + cardRect.width / 2);
      c.style.transition = 'opacity 0.3s ease 0.15s, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      c.style.zIndex = String(3 - i);
      setTimeout(function() {
        c.style.transform = 'translateX(' + offsetX + 'px) rotate(' + ((i - 1) * 4) + 'deg) scale(0.85)';
      }, i * 60);
      setTimeout(function() {
        c.style.opacity = '0';
      }, 350);
    });

    // Phase 2: New cards start stacked at center, then deal out to their positions
    setTimeout(function() {
      grid.innerHTML = '';
      recipesToShow.forEach(function(recipe, idx) {
        var card = buildCard(recipe, idx);
        card.style.opacity = '0';
        card.style.transform = 'translateX(0px) rotate(' + ((idx - 1) * -6) + 'deg) scale(0.8)';
        card.style.transition = 'opacity 0.4s ease, transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.zIndex = String(idx);
        grid.appendChild(card);
        setTimeout(function() {
          card.style.opacity = '1';
          card.style.transform = 'translateX(0) rotate(0deg) scale(1)';
        }, 100 + idx * 160);
      });
      // Re-apply magnetic tilt to new cards
      if (typeof window.applyMagneticToFeatured === 'function') window.applyMagneticToFeatured();
    }, 550);
  }

  function nextSlide() {
    renderSlide(pickRandom3());
  }

  function resetTimer() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(nextSlide, 5000);
  }

  // Pause on hover
  grid.addEventListener('mouseenter', () => { if (autoTimer) clearInterval(autoTimer); });
  grid.addEventListener('mouseleave', resetTimer);

  // Initial render
  renderSlide(pickRandom3());
  resetTimer();
}
// ========== Cursor Trail (All Pages) ==========
function initCursorTrail() {
  if (prefersReducedMotion) return;

  // Create cursor dot if not in HTML
  let cursorDot = document.getElementById('cursor-dot');
  if (!cursorDot) {
    cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    cursorDot.id = 'cursor-dot';
    document.body.appendChild(cursorDot);
  }

  const trails = [];
  const maxTrails = 8;

  for (let i = 0; i < maxTrails; i++) {
    const dot = document.createElement('div');
    dot.className = 'trail-dot';
    dot.style.opacity = String((1 - i / maxTrails) * 0.7);
    dot.style.width = dot.style.height = `${14 - i * 1.2}px`;
    document.body.appendChild(dot);
    trails.push({ el: dot, x: 0, y: 0 });
  }

  let mouseX = 0, mouseY = 0;

  cursorDot.style.display = 'block';
  trails.forEach(t => t.el.style.display = 'block');

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top = mouseY + 'px';
  });

  function animateTrails() {
    trails.forEach((trail, i) => {
      const prev = i === 0 ? { x: mouseX, y: mouseY } : trails[i - 1];
      trail.x += (prev.x - trail.x) * 0.22;
      trail.y += (prev.y - trail.y) * 0.22;
      trail.el.style.left = trail.x + 'px';
      trail.el.style.top = trail.y + 'px';
    });
    requestAnimationFrame(animateTrails);
  }
  animateTrails();

  // Store reference for magnetic cards to use
  window._cursorDot = cursorDot;
}

// ========== Magnetic 3D Cards (Homepage) ==========
function initMagneticCards() {
  const allGrids = document.querySelectorAll('.magnetic-grid');
  if (!allGrids.length || isCategoryPage) return;

  const cursorDot = window._cursorDot || document.getElementById('cursor-dot');

  // Apply magnetic tilt to a card
  function applyMagnetic(card) {
    if (prefersReducedMotion) return;
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - rect.height / 2) / (rect.height / 2) * -6;
      const rotateY = (x - rect.width / 2) / (rect.width / 2) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
      if (cursorDot) cursorDot.classList.add('hovering');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      if (cursorDot) cursorDot.classList.remove('hovering');
    });
  }

  // Scroll reveal observer for recipe-card-items
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.magDelay || '0', 10);
        setTimeout(() => e.target.classList.remove('card-hidden'), delay);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  function setupRecipeCard(card, i) {
    card.classList.add('magnetic-card', 'card-hidden');
    card.dataset.magDelay = String((i % 3) * 100);
    applyMagnetic(card);
    revealObs.observe(card);
  }

  // Apply tilt to featured recipe cards (already have .magnetic-card in HTML)
  document.querySelectorAll('.featured-recipe.magnetic-card').forEach(card => {
    applyMagnetic(card);
  });

  // Expose for slideshow re-application
  window.applyMagneticToFeatured = function() {
    document.querySelectorAll('.featured-recipe.magnetic-card').forEach(card => {
      applyMagnetic(card);
    });
  };

  // Apply to recipe-grid cards
  const recipeGridEl = document.getElementById('recipe-grid');
  if (recipeGridEl) {
    recipeGridEl.querySelectorAll('.recipe-card-item').forEach((c, i) => setupRecipeCard(c, i));

    // Watch for new cards added by renderCards / load more
    const mo = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach((node, i) => {
          if (node.nodeType === 1 && node.classList.contains('recipe-card-item')) {
            setupRecipeCard(node, i);
          }
        });
      });
    });
    mo.observe(recipeGridEl, { childList: true });
  }
}

// ========== Init ==========
renderCategoryCounts();
renderCards();
initCounterAnimations();
initCursorTrail();
initMagneticCards();
initFeaturedSlideshow();
