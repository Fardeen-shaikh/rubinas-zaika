# Rubina's Zaika — Project Notes

## Project Overview
- **Type**: Static recipe reading website for YouTube cooking channel "Rubina's Zaika"
- **Channel**: https://www.youtube.com/channel/UCRaHm_R2lWXCuYroSKLkfBg
- **Stats**: 866+ subscribers, 147 videos, 99K+ views
- **Content**: Indian dishes, snacks, sweets, cooking tips (Hindi/Hinglish)
- **Stack**: HTML + Tailwind CSS (CDN) + vanilla JS — NO build tools

---

## File Structure
```
c:\Projects\Rubinas zaika\
├── frontend/                     # Website (open index.html in browser)
│   ├── index.html                # Main single-page website
│   ├── css/styles.css            # Custom CSS (animations, scrollbar, modal, cards)
│   ├── js/recipe-data.js         # 37 recipes with full data (from transcripts)
│   ├── js/main.js                # All JS logic (nav, filters, cards, modal)
│   └── images/logo.svg           # SVG "R" lettermark logo
├── data/                         # Raw data & transcripts
│   ├── transcripts/              # 37 .hi.vtt files (Hindi auto-captions)
│   ├── parsed-transcripts.json   # Clean text extracted from VTT files
│   └── rubinas zaika overview.json  # Channel data export (147 videos)
├── tools/                        # Build/extraction tools
│   ├── yt-dlp.exe                # YouTube transcript downloader
│   ├── package.json              # Node deps for transcript parsing
│   └── package-lock.json
└── docs/                         # Documentation
    ├── PROJECT-NOTES.md          # This file
    └── LANGUAGES-PLAN.md         # Plan for multi-language support
```

---

## CDN Dependencies (loaded in index.html)
- Tailwind CSS via cdn.tailwindcss.com
- Google Fonts: Playfair Display, Nunito, Dancing Script
- AOS (Animate On Scroll) via unpkg

## Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Saffron | #D4740E | Primary accent, buttons, highlights |
| Saffron Dark | #B85C00 | Hover states |
| Crimson | #C0392B | YouTube/CTA buttons |
| Cream | #FAFAF8 | Background |
| Dark Brown | #1A1210 | Text |
| Warm Gray | #707070 | Secondary text |

---

## Key Technical Decisions

### 1. No iframes — Thumbnail Cards Instead
YouTube iframe embeds showed Error 153 (embedding disabled for Shorts).
Solution: Clickable thumbnail cards linking to YouTube with play button overlay.

### 2. Thumbnail Display
- Primary: `maxresdefault.jpg` (1280x720, 16:9) — clean, no bars
- Fallback: `hqdefault.jpg` with `scale(1.2)` CSS to crop baked-in black bars
- Container uses `aspect-ratio:16/9` with `object-cover`

### 3. Recipe Data from Real Transcripts
Used `yt-dlp.exe` to download auto-generated Hindi captions for 37 top videos.
Parsed VTT files into clean text, then translated to English with real ingredients/methods.
Each recipe is faithful to what Rubina actually says in the video.

### 4. Recipe Modal = Full Reading Experience
Near-full-screen scrollable modal with sections:
Hero thumbnail → Meta bar → Quick info (prep/cook/servings) → Intro → Ingredients → Method → Tips → Outro → YouTube CTA

---

## Recipe Categories & Counts
| Category | Count |
|----------|-------|
| Non-Veg | 13 |
| Main Course | 9 |
| Snacks | 8 |
| Sweets | 5 |
| Breakfast | 1 |
| Chutney | 1 |
| **Total** | **37** |

---

## What's Completed
- Full single-page website with all sections
- 37 recipes with real transcript-based data
- Recipe card grid with category filters + Load More
- Full-screen recipe reading modal
- Glassmorphism navbar with mobile menu
- AOS scroll animations
- SVG logo
- Modern saffron/cream color palette

## What's Pending
- **Multi-language support** (12 languages planned — see LANGUAGES-PLAN.md)
- **Formspree ID** — Contact form uses placeholder `YOUR_FORM_ID`
- **Social links** — Instagram, Facebook, X are placeholder `#`
- **Hero/About images** — Still using Unsplash placeholder URLs
- **No git repo** — Project is not git-initialized

---

## How Recipe Data Was Created
1. Exported channel data to `rubinas zaika overview.json` (147 videos)
2. Selected top 37 videos (>2min duration, sorted by views)
3. Downloaded Hindi auto-captions using: `yt-dlp.exe --write-auto-sub --sub-lang hi --skip-download --sub-format vtt`
4. Parsed VTT → clean Hindi text → `parsed-transcripts.json`
5. Translated and structured into `js/recipe-data.js` with: title, ingredients, method, tips, intro, outro
