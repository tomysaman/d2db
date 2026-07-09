# Sanctuary Codex

A static, browser-based archive of **Diablo II: Resurrected** runewords and item sets — built for fast searching, filtering, and browsing without any backend.

## Pages

- **`index.html`** — Runeword archive (104 runewords). Search by name/stat, filter by item category, socket count, rune content, and ladder status; toggle a rune-grid view; click a card for full details in a modal.
- **`sets.html`** — Item Set archive (35 sets). Search by name/stat, filter by class and category, click a card for full set details (pieces, partial/full bonuses) in a modal.

## Project structure

```
index.html              Runeword archive page
sets.html                Item Set archive page
app.js                    Runeword page logic (filtering, sorting, rendering, modal)
sets-app.js               Item Set page logic (filtering, sorting, rendering, modal)
styles.css                 Shared site styles
runewords-styles.css       Runeword-page-specific styles
sets-styles.css            Item Set-page-specific styles
data/
  runewords-data.js        Runeword dataset (embedded as a JS constant)
  sets-data.js              Item Set dataset (embedded as a JS constant)
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

Opening `index.html`/`sets.html` directly via `file://` also works in most browsers, though a local server is recommended to avoid any fetch/CORS quirks.

## Data

Data lives in `data/runewords-data.js` and `data/sets-data.js` as plain JS constants (`RUNEWORDS_DATA`, `SETS_DATA`) loaded directly by the HTML pages — no fetch or build step required. These files are generated from the raw scrape data in `scratch/` via `scratch/transform.py` and should not be hand-edited directly; regenerate them from `scratch/` instead.

Source data is scraped from [maxroll.gg](https://maxroll.gg/d2/database).
