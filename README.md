# Diablo II Codex

A static, browser-based archive of **Diablo II: Resurrected** runewords, item sets, and Horadric Cube recipes — built for fast searching, filtering, and browsing without any backend.

## Why

- D2 got a new hero class in 2026, so it's time to play it again
- Wanted a fast, local tool to look up runewords, item sets, and cube recipes without digging through wikis

## Features

- Runs completely locally — static HTML/CSS/JS, no database or backend
- Runewords: search by name or any effect stat (e.g. "+2 to all skills"); filter by item category, socket count, rune content, and ladder status; sort by category, level, name, or socket count; toggle a rune-grid view
- Item sets: search by name or any effect stat; filter by class and category; view full set details (pieces, partial/full bonuses) in a modal
- Horadric Cube recipes: search by recipe, ingredient, or result; filter by category and expansion content; grouped by category with rune ingredient icons and probability tables
- Two themes, switchable from the nav and remembered per browser: **Dark** (default) and **Paper**, a cut-paper diorama with Diablo II scenery

## Pages

- **`index.html`** — Runeword archive (104 runewords). Search by name/stat, filter by item category, socket count, rune content, and ladder status; toggle a rune-grid view; click a card for full details in a modal.
- **`sets.html`** — Item Set archive (35 sets). Search by name/stat, filter by class and category, click a card for full set details (pieces, partial/full bonuses) in a modal.
- **`recipes.html`** — Horadric Cube recipe archive (130 recipes, including all 36 crafted-item recipes). Search by recipe/ingredient/result/guaranteed stat, filter by category and expansion content; recipes are grouped by category and any rune ingredient renders with its icon. Click a card for notes and probability tables in a modal.

## Themes

- `styles.css` is the **Dark** theme and `styles-paper.css` the **Paper** theme; both are shared by all three pages, with page-specific styles in `*-styles.css`.
- `theme.js` (loaded in `<head>`) disables the inactive theme stylesheet before first paint and wires up the nav toggle. The choice is saved in `localStorage`.
- The Paper theme's header scenery lives in `assets/paper/*.svg`.

## Running locally

This is a static site with no build step or dependencies — just open `index.html`, `sets.html`, or `recipes.html` directly in a browser.

## Data

Data lives in `data/*.js` as plain JS constants loaded directly by the HTML pages — no fetch or build step required.

- `data/runewords-data.js` (`RUNEWORDS_DATA`) and `data/sets-data.js` (`SETS_DATA`) are **generated** from the raw reference data in `scratch/` via `scratch/transform.py`. Do not hand-edit them; regenerate from `scratch/` instead.
- `data/recipes-data.js` (`RECIPES_DATA`, plus `RECIPE_CATEGORY_ORDER` and `RECIPE_CATEGORY_LABELS`) is **hand-authored** from the maxroll articles and is edited directly — `transform.py` does not touch it.

Source data is compiled from [maxroll.gg](https://maxroll.gg/d2/database). Recipes come from two maxroll guides: the [Horadric Cube Recipes guide](https://maxroll.gg/d2/resources/horadric-cube-recipes) for the 94 general recipes, and [Crafted Items](https://maxroll.gg/d2/items/crafted-items) for the 36 crafting recipes.
