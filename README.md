# Sanctuary Codex

A static, browser-based archive of **Diablo II: Resurrected** runewords, item sets, and Horadric Cube recipes — built for fast searching, filtering, and browsing without any backend.

## Pages

- **`index.html`** — Runeword archive (104 runewords). Search by name/stat, filter by item category, socket count, rune content, and ladder status; toggle a rune-grid view; click a card for full details in a modal.
- **`sets.html`** — Item Set archive (35 sets). Search by name/stat, filter by class and category, click a card for full set details (pieces, partial/full bonuses) in a modal.
- **`recipes.html`** — Horadric Cube recipe archive (130 recipes, including all 36 crafted-item recipes). Search by recipe/ingredient/result/guaranteed stat, filter by category and expansion content; recipes are grouped by category and any rune ingredient renders with its icon. Click a card for notes and probability tables in a modal.

## Project structure

```
index.html              Runeword archive page
sets.html                Item Set archive page
recipes.html              Horadric Cube recipe archive page
app.js                    Runeword page logic (filtering, sorting, rendering, modal)
sets-app.js               Item Set page logic (filtering, sorting, rendering, modal)
recipes-app.js            Cube Recipe page logic (filtering, sorting, rendering, modal)
styles.css                 Shared site styles
runewords-styles.css       Runeword-page-specific styles
sets-styles.css            Item Set-page-specific styles
recipes-styles.css         Cube Recipe-page-specific styles
data/
  runewords-data.js        Runeword dataset (embedded as a JS constant)
  sets-data.js              Item Set dataset (embedded as a JS constant)
  recipes-data.js           Cube Recipe dataset (embedded as a JS constant)
assets/
  runes/                    Rune icon images
  sets/                      Item Set icon images
scratch/                   Source scrape data (JSON/Markdown) and the transform script used to generate data/*.js
```

## Running locally

This is a static site with no build step or dependencies — just serve the directory and open it in a browser:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/index.html
```

Opening `index.html`/`sets.html`/`recipes.html` directly via `file://` also works in most browsers, though a local server is recommended to avoid any fetch/CORS quirks.

## Data

Data lives in `data/*.js` as plain JS constants loaded directly by the HTML pages — no fetch or build step required.

- `data/runewords-data.js` (`RUNEWORDS_DATA`) and `data/sets-data.js` (`SETS_DATA`) are **generated** from the raw scrape data in `scratch/` via `scratch/transform.py`. Do not hand-edit them; regenerate from `scratch/` instead.
- `data/recipes-data.js` (`RECIPES_DATA`, plus `RECIPE_CATEGORY_ORDER` and `RECIPE_CATEGORY_LABELS`) is **hand-authored** from the maxroll articles and is edited directly — `transform.py` does not touch it.

Source data is scraped from [maxroll.gg](https://maxroll.gg/d2/database). Recipes come from two maxroll guides: the [Horadric Cube Recipes guide](https://maxroll.gg/d2/resources/horadric-cube-recipes) for the 94 general recipes, and [Crafted Items](https://maxroll.gg/d2/items/crafted-items) for the 36 crafting recipes.
