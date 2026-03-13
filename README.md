# Rubina's Zaika

Recipe companion website for the YouTube cooking channel **[Rubina's Zaika](https://www.youtube.com/channel/UCRaHm_R2lWXCuYroSKLkfBg)**.

## Features

- **93+ recipes** extracted from actual YouTube video transcripts
- **Individual recipe pages** with SEO, Schema.org markup, and print-friendly layout
- **Multi-language support** — English, Hindi, Urdu (RTL), Marathi
- **Category filtering** — Non-Veg, Snacks, Sweets, Main Course, Breakfast, Chutney
- **Auto-rotating featured recipes** with card shuffle animation
- **Auto-update pipeline** — GitHub Actions detects new YouTube uploads every 6 hours

## Tech Stack

- HTML + Tailwind CSS (CDN) + Vanilla JavaScript
- No build tools, no npm for frontend
- Node.js tools for recipe data processing
- Claude AI (Haiku) for transcript parsing
- GitHub Actions for automation
- GitHub Pages for hosting

## Auto-Update Pipeline

New videos uploaded to the YouTube channel are automatically detected and added to the website:

1. GitHub Actions runs every 6 hours
2. Checks YouTube RSS feed for new videos
3. Downloads Hindi transcript via yt-dlp
4. Claude AI parses transcript into structured recipe data
5. Auto-generates Hindi, Urdu, Marathi translations
6. Regenerates all HTML pages
7. Commits and deploys via GitHub Pages

## Project Structure

```
frontend/          Website (static files)
  index.html       Homepage
  category.html    Category filter page
  recipes/         93+ individual recipe pages
  css/             Styles
  js/              Scripts + language files
data/              Raw data & tracking files
tools/             Build & automation scripts
.github/           GitHub Actions workflow
```

## Setup

1. Clone the repo
2. Open `frontend/index.html` in a browser
3. For automation: add `ANTHROPIC_API_KEY` as a GitHub Secret

## Channel

- **YouTube**: [Rubina's Zaika](https://www.youtube.com/channel/UCRaHm_R2lWXCuYroSKLkfBg)
- **Content**: Indian dishes, snacks, sweets, cooking tips
- **Language**: Hindi/Hinglish
