# Multi-Language Recipe Support — Plan

## Languages to Add

| # | Language | Code | Script | Source |
|---|----------|------|--------|--------|
| 1 | English | en | Latin | Already exists (translated from Hindi transcripts) |
| 2 | Hindi | hi | Devanagari | Original video transcripts (auto-generated) |
| 3 | Urdu | ur | Nastaliq/Arabic | Transliterated from Hindi (channel audience speaks Urdu too) |
| 4 | Bengali | bn | Bengali | Translated from English/Hindi |
| 5 | Tamil | ta | Tamil | Translated from English |
| 6 | Telugu | te | Telugu | Translated from English |
| 7 | Marathi | mr | Devanagari | Translated from Hindi |
| 8 | Gujarati | gu | Gujarati | Translated from Hindi |
| 9 | Kannada | kn | Kannada | Translated from English |
| 10 | Malayalam | ml | Malayalam | Translated from English |
| 11 | Punjabi | pa | Gurmukhi | Translated from Hindi |
| 12 | Arabic | ar | Arabic | Translated from English (RTL support) |

## Architecture

### Approach: Separate language files + JS language switcher

1. **`js/recipe-data.js`** — English recipes (base, already done)
2. **`js/lang/hi.js`** — Hindi translations for all 37 recipes
3. **`js/lang/ur.js`** — Urdu translations
4. **`js/lang/bn.js`** — Bengali translations
5. **`js/lang/ta.js`** — Tamil translations
6. **`js/lang/te.js`** — Telugu translations
7. **`js/lang/mr.js`** — Marathi translations
8. **`js/lang/gu.js`** — Gujarati translations
9. **`js/lang/kn.js`** — Kannada translations
10. **`js/lang/ml.js`** — Malayalam translations
11. **`js/lang/pa.js`** — Punjabi translations
12. **`js/lang/ar.js`** — Arabic translations

### Each language file structure:
```javascript
const lang_hi = {
  name: "हिन्दी",
  code: "hi",
  dir: "ltr", // or "rtl" for Arabic/Urdu
  ui: {
    ingredients: "सामग्री",
    method: "विधि",
    tips: "टिप्स",
    prepTime: "तैयारी",
    cookTime: "पकाने का समय",
    servings: "सर्विंग्स",
    watchVideo: "यूट्यूब पर देखें",
    readRecipe: "पूरी रेसिपी पढ़ें",
    loadMore: "और रेसिपी देखें",
    // ... other UI strings
  },
  recipes: {
    "HfxVv2gk3tA": {
      title: "अल्बैक स्टाइल चिकन रैप",
      description: "...",
      intro: "...",
      ingredients: [...],
      method: [...],
      outro: "...",
      tips: [...]
    },
    // ... all 37 recipes
  }
};
```

### UI Changes:
- Language selector dropdown in modal header (globe icon + current language name)
- Persists selection via localStorage
- Dynamically switches all text content when language changes
- RTL support for Arabic and Urdu

### Fields to translate per recipe:
- title
- description
- intro
- ingredients[] (all items)
- method[] (all steps)
- outro
- tips[] (all items)

### UI strings to translate:
- "Ingredients", "Step-by-Step Method", "Rubina's Tips"
- "Prep", "Cook", "Servings"
- "Watch Full Recipe on YouTube", "Watch Video"
- "Read full recipe", "Load More"
- "All Recipes", category names
- Section headings: "Our Recipes", "What's Cooking?"

## Implementation Order
1. Create language file structure and Hindi translations (from original transcripts)
2. Add language selector UI to modal
3. Wire up JS to switch languages dynamically
4. Add remaining languages one by one
5. Add RTL CSS support for Arabic/Urdu
