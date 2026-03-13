// Generate individual SEO-optimized recipe pages
// Each recipe gets: /recipes/slug.html with Schema.org JSON-LD, OG tags, semantic HTML

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load recipe data
let recipeSrc = fs.readFileSync(path.join(__dirname, '../frontend/js/recipe-data.js'), 'utf8');
recipeSrc = recipeSrc.replace(/^const\s+/, 'var ');
const ctx = vm.createContext({});
vm.runInContext(recipeSrc, ctx);
const recipes = ctx.recipes;

console.log(`Loaded ${recipes.length} recipes`);

// Site config
const SITE_URL = 'https://rubinaszaika.com'; // Update when domain is set
const SITE_NAME = "Rubina's Zaika";
const YT_CHANNEL = 'https://www.youtube.com/channel/UCRaHm_R2lWXCuYroSKLkfBg';

// Category labels
const catLabels = {
  nonveg: 'Non-Veg', snacks: 'Snacks', sweets: 'Sweets',
  maincourse: 'Main Course', breakfast: 'Breakfast', chutney: 'Chutney'
};

const catColors = {
  nonveg: { bg: 'bg-red-600', text: 'text-white' },
  snacks: { bg: 'bg-amber-600', text: 'text-white' },
  sweets: { bg: 'bg-pink-500', text: 'text-white' },
  maincourse: { bg: 'bg-emerald-600', text: 'text-white' },
  breakfast: { bg: 'bg-yellow-500', text: 'text-white' },
  chutney: { bg: 'bg-lime-600', text: 'text-white' },
};

// Slugify title
function slugify(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// Escape HTML
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Parse duration like "2:59" to ISO 8601 PT format
function parseDuration(dur) {
  if (!dur) return 'PT0M';
  const parts = dur.split(':');
  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseInt(parts[1], 10);
    return `PT${m}M${s}S`;
  }
  return 'PT0M';
}

// Parse prep/cook time like "40 min" to ISO 8601
function parseTime(t) {
  if (!t || t === '-') return null;
  const m = t.match(/(\d+)\s*min/i);
  if (m) return `PT${m[1]}M`;
  const h = t.match(/(\d+)\s*h/i);
  if (h) return `PT${h[1]}H`;
  return null;
}

// Format views
function formatViews(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toString();
}

// Generate Schema.org Recipe JSON-LD
function generateSchema(recipe, slug) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.description,
    image: `https://i.ytimg.com/vi/${recipe.id}/maxresdefault.jpg`,
    author: {
      '@type': 'Person',
      name: "Rubina's Zaika",
      url: YT_CHANNEL
    },
    url: `${SITE_URL}/recipes/${slug}.html`,
    recipeCategory: catLabels[recipe.category] || recipe.category,
    recipeCuisine: 'Indian',
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.method.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      text: step
    })),
    video: {
      '@type': 'VideoObject',
      name: recipe.title,
      description: recipe.description,
      thumbnailUrl: `https://i.ytimg.com/vi/${recipe.id}/maxresdefault.jpg`,
      contentUrl: `https://www.youtube.com/watch?v=${recipe.id}`,
      embedUrl: `https://www.youtube.com/embed/${recipe.id}`,
      uploadDate: '2024-01-01' // Approximate
    }
  };

  if (recipe.servings) schema.recipeYield = recipe.servings;
  if (parseTime(recipe.prepTime)) schema.prepTime = parseTime(recipe.prepTime);
  if (parseTime(recipe.cookTime)) schema.cookTime = parseTime(recipe.cookTime);

  // Total time
  const prep = recipe.prepTime ? parseInt(recipe.prepTime) || 0 : 0;
  const cook = recipe.cookTime ? parseInt(recipe.cookTime) || 0 : 0;
  if (prep + cook > 0) schema.totalTime = `PT${prep + cook}M`;

  return JSON.stringify(schema, null, 2);
}

// BreadcrumbList schema
function generateBreadcrumb(recipe, slug) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Recipes', item: `${SITE_URL}/#recipes` },
      { '@type': 'ListItem', position: 3, name: catLabels[recipe.category], item: `${SITE_URL}/#recipes` },
      { '@type': 'ListItem', position: 4, name: recipe.title, item: `${SITE_URL}/recipes/${slug}.html` }
    ]
  });
}

// Generate HTML for a recipe page
function generatePage(recipe, slug, allRecipes) {
  const ytUrl = `https://www.youtube.com/watch?v=${recipe.id}`;
  const cat = catColors[recipe.category] || catColors.snacks;
  const catLabel = catLabels[recipe.category] || recipe.category;
  const thumbnail = `https://i.ytimg.com/vi/${recipe.id}/maxresdefault.jpg`;
  const fallbackThumb = `https://i.ytimg.com/vi/${recipe.id}/hqdefault.jpg`;

  // Related recipes (same category, exclude self, max 4)
  const related = allRecipes
    .filter(r => r.category === recipe.category && r.id !== recipe.id)
    .sort((a, b) => b.views - a.views)
    .slice(0, 4);

  const ingredientsList = recipe.ingredients.map(ing =>
    `              <li class="py-1.5 text-stone-700 text-[15px] leading-relaxed">${esc(ing)}</li>`
  ).join('\n');

  const methodSteps = recipe.method.map((step, i) =>
    `              <li class="pb-3 text-stone-700 text-[15px] leading-relaxed"><span class="font-heading font-bold text-stone-900 mr-1">${i + 1}.</span>${esc(step)}</li>`
  ).join('\n');

  const tipsHtml = (recipe.tips && recipe.tips.length > 0) ? `
        <!-- Tips -->
        <div class="mt-8 pt-6 border-t border-stone-200">
          <h2 id="rp-tips-heading" class="font-heading text-lg uppercase tracking-wider text-stone-800 mb-3">Tips</h2>
          <ul id="rp-tips" class="space-y-1.5">
${recipe.tips.map(tip => `            <li class="text-stone-600 text-sm leading-relaxed"><span class="text-amber-600 font-bold mr-1">*</span>${esc(tip)}</li>`).join('\n')}
          </ul>
        </div>` : '';

  const relatedHtml = related.length > 0 ? `
    <!-- Related Recipes -->
    <section class="max-w-2xl mx-auto px-4 mt-10">
      <h2 class="font-heading text-xl uppercase tracking-wider text-stone-800 mb-5">More ${esc(catLabel)} Recipes</h2>
      <div class="grid sm:grid-cols-2 gap-4">
${related.map(r => {
  const rSlug = slugify(r.title);
  return `        <a href="${rSlug}.html" class="flex gap-3 bg-white rounded-lg border border-stone-200 overflow-hidden hover:border-amber-300 hover:shadow-md transition-all group">
          <img src="https://i.ytimg.com/vi/${r.id}/mqdefault.jpg" alt="${esc(r.title)}" class="w-28 h-20 object-cover flex-shrink-0" loading="lazy">
          <div class="py-2 pr-3 min-w-0">
            <h3 class="text-sm font-semibold text-stone-800 group-hover:text-amber-700 transition-colors line-clamp-2">${esc(r.title)}</h3>
            <p class="text-xs text-stone-400 mt-1">${r.duration} &middot; ${formatViews(r.views)} views</p>
          </div>
        </a>`;
}).join('\n')}
      </div>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(recipe.title)} - ${SITE_NAME} | Indian Recipe</title>
  <meta name="description" content="${esc(recipe.description)}">
  <meta name="keywords" content="${esc(recipe.title)}, indian recipe, ${catLabel.toLowerCase()}, homemade, cooking, ${SITE_NAME}">
  <link rel="canonical" href="${SITE_URL}/recipes/${slug}.html">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(recipe.title)} - ${SITE_NAME}">
  <meta property="og:description" content="${esc(recipe.description)}">
  <meta property="og:image" content="${thumbnail}">
  <meta property="og:url" content="${SITE_URL}/recipes/${slug}.html">
  <meta property="og:site_name" content="${SITE_NAME}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(recipe.title)} - ${SITE_NAME}">
  <meta name="twitter:description" content="${esc(recipe.description)}">
  <meta name="twitter:image" content="${thumbnail}">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="../images/logo.svg">

  <!-- Schema.org Recipe -->
  <script type="application/ld+json">
${generateSchema(recipe, slug)}
  </script>

  <!-- Breadcrumb Schema -->
  <script type="application/ld+json">
${generateBreadcrumb(recipe, slug)}
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            body: ['Nunito', 'sans-serif'],
            heading: ['Playfair Display', 'Georgia', 'serif'],
          },
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Nunito', sans-serif; }
    .font-heading { font-family: 'Playfair Display', Georgia, serif; }
    .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
    .recipe-card { box-shadow: 0 4px 30px rgba(0,0,0,0.07); }
    @media print {
      nav, footer, .no-print { display: none !important; }
      .recipe-card { box-shadow: none; border: 1px solid #e5e5e5; }
    }
  </style>
</head>
<body class="bg-[#F0ECE6] text-stone-800">

  <!-- Nav -->
  <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-200">
    <div class="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
      <a href="../index.html" class="flex items-center gap-2 text-amber-700 font-bold">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        All Recipes
      </a>
      <a href="${ytUrl}" target="_blank" rel="noopener" class="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full text-sm font-bold transition-colors no-print">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        Watch Video
      </a>
    </div>
  </nav>

  <article class="max-w-2xl mx-auto px-4 py-8">

    <!-- Recipe Card -->
    <div class="recipe-card bg-white rounded-2xl overflow-hidden">

      <!-- Card Header -->
      <div class="px-8 pt-8 pb-4 sm:px-10 sm:pt-10">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h1 id="rp-title" class="font-heading text-3xl sm:text-4xl font-black text-stone-900 uppercase leading-tight tracking-wide">${esc(recipe.title)}</h1>
            <p class="text-xs uppercase tracking-[0.2em] text-stone-400 mt-2 font-semibold">${esc(recipe.description).substring(0, 80)}${recipe.description.length > 80 ? '...' : ''}</p>
          </div>
          <div class="flex-shrink-0 text-right space-y-2 pt-1">
            <div class="flex items-center gap-2 justify-end text-stone-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span id="rp-servings-label" class="text-xs font-semibold uppercase tracking-wide">${recipe.servings || '-'} servings</span>
            </div>
            <div class="flex items-center gap-2 justify-end text-stone-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span class="text-xs font-semibold uppercase tracking-wide">${recipe.prepTime || '-'} + ${recipe.cookTime || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-8 sm:mx-10 border-t border-stone-200"></div>

      <!-- Food Image -->
      <div class="relative rounded-xl overflow-hidden mx-8 sm:mx-10 my-6" style="aspect-ratio:16/9;">
        <img src="${thumbnail}" alt="${esc(recipe.title)}"
          class="w-full h-full object-cover"
          onerror="this.onerror=null;this.src='${fallbackThumb}'">
        <a href="${ytUrl}" target="_blank" rel="noopener" class="absolute inset-0 flex items-center justify-center group no-print">
          <div class="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors"></div>
          <div class="relative w-14 h-14 bg-red-600/90 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
            <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </a>
      </div>

      <!-- Two Column: Ingredients + Directions -->
      <div class="px-8 pb-8 sm:px-10 sm:pb-10">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

          <!-- Ingredients -->
          <div class="bg-stone-50 rounded-xl p-6">
            <h2 id="rp-ingredients-heading" class="font-heading text-xl uppercase tracking-wider text-stone-800 mb-4 pb-2 border-b border-stone-200">Ingredients</h2>
            <ul id="rp-ingredients" class="space-y-0.5 list-disc list-inside marker:text-amber-600">
${ingredientsList}
            </ul>
          </div>

          <!-- Directions -->
          <div>
            <h2 id="rp-method-heading" class="font-heading text-xl uppercase tracking-wider text-stone-800 mb-4 pb-2 border-b border-stone-200">Directions</h2>
            <ol id="rp-method" class="space-y-1">
${methodSteps}
            </ol>
          </div>

        </div>
${tipsHtml}
      </div>

      <!-- Intro / Description -->
      <div class="px-8 pb-6 sm:px-10">
        <p id="rp-intro" class="text-stone-500 text-sm leading-relaxed italic">${esc(recipe.intro || recipe.description)}</p>
      </div>

${recipe.outro ? `
      <!-- Outro -->
      <div class="px-8 pb-8 sm:px-10 text-center border-t border-stone-100 pt-5 mx-8 sm:mx-10">
        <p id="rp-outro" class="text-stone-400 italic text-sm">${esc(recipe.outro)}</p>
      </div>` : ''}

      <!-- YouTube CTA -->
      <div class="px-8 pb-8 sm:px-10 text-center no-print">
        <a href="${ytUrl}" target="_blank" rel="noopener"
          class="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          <span id="rp-yt-cta">Watch Full Recipe on YouTube</span>
        </a>
      </div>

    </div><!-- end recipe-card -->

${relatedHtml}

  </article>

  <!-- Footer -->
  <footer class="bg-stone-800 text-stone-400 py-8 mt-8">
    <div class="max-w-3xl mx-auto px-4 text-center text-sm">
      <a href="../index.html" class="text-amber-500 font-bold hover:text-amber-400 transition-colors">${SITE_NAME}</a>
      <p class="mt-2">&copy; 2026 ${SITE_NAME}. Simple homemade recipes, straight from the heart.</p>
      <div class="flex items-center justify-center gap-4 mt-3">
        <a href="${YT_CHANNEL}" target="_blank" rel="noopener" class="hover:text-white transition-colors">YouTube</a>
        <a href="../index.html#contact" class="hover:text-white transition-colors">Contact</a>
        <a href="../index.html#about" class="hover:text-white transition-colors">About</a>
      </div>
    </div>
  </footer>

  <!-- Language Support -->
  <script src="../js/lang/hi.js"></script>
  <script src="../js/lang/ur.js"></script>
  <script src="../js/lang/mr.js"></script>
  <script src="../js/recipe-page-lang.js"></script>
</body>
</html>`;
}

// Create output directory
const outDir = path.join(__dirname, '../frontend/recipes');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Track slugs to avoid duplicates
const usedSlugs = new Set();
const slugMap = []; // {id, slug, title, category} for sitemap

recipes.forEach(recipe => {
  let slug = slugify(recipe.title);
  // Handle duplicates
  if (usedSlugs.has(slug)) {
    slug = slug + '-' + recipe.id.substring(0, 6);
  }
  usedSlugs.add(slug);

  const html = generatePage(recipe, slug, recipes);
  fs.writeFileSync(path.join(outDir, `${slug}.html`), html, 'utf8');
  slugMap.push({ id: recipe.id, slug, title: recipe.title, category: recipe.category });
});

console.log(`Generated ${slugMap.length} recipe pages in frontend/recipes/`);

// Write slug map for use by other tools
fs.writeFileSync(
  path.join(__dirname, 'slug-map.json'),
  JSON.stringify(slugMap, null, 2),
  'utf8'
);
console.log('Written slug-map.json');

// Also write frontend slug-map.js
const slugMapJs = 'const recipeSlugMap = {\n' +
  slugMap.map(r => `  "${r.id}": "${r.slug}"`).join(',\n') +
  '\n};\n';
fs.writeFileSync(
  path.join(__dirname, '../frontend/js/slug-map.js'),
  slugMapJs,
  'utf8'
);
console.log('Written frontend/js/slug-map.js');

// Generate sitemap.xml
const today = new Date().toISOString().split('T')[0];
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${slugMap.map(r => `  <url>
    <loc>${SITE_URL}/recipes/${r.slug}.html</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, '../frontend/sitemap.xml'), sitemap, 'utf8');
console.log('Written sitemap.xml');

// Generate robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

fs.writeFileSync(path.join(__dirname, '../frontend/robots.txt'), robots, 'utf8');
console.log('Written robots.txt');
