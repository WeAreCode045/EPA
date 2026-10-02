---
description: Polish an existing Elementor page section-by-section against mockup PNGs via EMCP until visual parity (iterative compare-and-fix)
---

# Elementor match section mockups (EMCP polish loop)

You are invoked via **`/elementor-match-section-mockups`** in Cursor chat. For a **named page that already exists on WordPress**, compare each live section (top to bottom) to the matching section mockup PNG in that page’s `sections/` folder (natural filename order). **Edit** layout, styles, copy, icons, and images through EMCP until each section matches the mockup as closely as feasible, within a per-section iteration budget.

**This command does not build a page from scratch.** If the page or sections are missing, use **`/elementor-page-from-sections`** first, then run this command to polish.

**MCP namespace:** `project-0-EPA-emcp-dev1-dev045-nl`  
Use `GetDynamicTools` on that namespace if a tool schema is unclear, then `CallDynamicTool` to invoke.

**Browser verification:** Section comparisons and final checks **must** use **Browser DevTools MCP** only (not Cursor’s built-in browser). Prefer batched `execute` flows for scroll → highlight → screenshot per section. Workspace rules require browser verification before declaring a section or page done.

**Do not** push Appwrite or run `appwrite push`. **Do not** create a git commit unless the user explicitly asks.

## Page name (required)

Resolve the page slug/title from the user’s message. Accept any of:

| Form | Example |
|------|---------|
| Flag | `/elementor-match-section-mockups --page Home` |
| Flag with `=` | `/elementor-match-section-mockups --page=Home` |
| Key phrase | `pagename: Home` or `page: Home` |
| Bare name after command | `/elementor-match-section-mockups Home` (only if unambiguous) |

**`pagename`** is the folder name under mockups `pages/` (case-sensitive on disk; e.g. `Home` not `home` unless that folder exists). Use it for:

- Mockup path: `projects/theoriemeesters/mockups/pages/<pagename>/sections/`
- Finding the WordPress page by **title** when `--post-id` is omitted (default title: same as `pagename`)

If `--page` / `pagename` is missing, stop once and ask the user (e.g. `--page Home`).

## Optional flags

| Flag | Purpose | Default |
|------|---------|---------|
| **`--post-id <id>`** | WordPress page `post_id` to polish (Elementor document) | Find page by title matching `pagename`; if ambiguous, ask once |
| **`--sections-dir <path>`** | Override mockup PNG directory | See resolution order below |
| **`--max-iterations <n>`** | Max compare-and-fix loops **per section** | **`3`** |

Also accept user phrasing in chat: `post id: 1061`, `max iterations: 5`, `@`-mentioned folders for `--sections-dir`.

## Section mockup paths

Always resolve paths under the EPA workspace root: `/Users/maurice/EPA`.

> User typo **`pafes`** → always use **`pages`**.

### Directory layout (reference)

```text
projects/theoriemeesters/mockups/pages/
└── Home/
    └── sections/
        ├── 1. Hero.png
        ├── 2. USPs.png
        ├── 3. Product Categories.png
        └── …
```

### Resolution order

Search for section PNGs in this order; use the **first** directory that exists and contains at least one `*.png`:

1. **User override** — `--sections-dir /absolute/or/relative/path` or an `@`-mentioned folder in chat
2. **Project mockups (default for theoriemeesters)** —  
   `projects/theoriemeesters/mockups/pages/<pagename>/sections/`
3. **EPA generic** — `pages/<pagename>/sections/` (under EPA root)

**If no images are found:** stop once; ask the user to confirm `pagename` and path.

### Listing and sort order (critical)

Mockups and **live section order** must align by index in **natural (version) sort** of filenames:

```bash
ls -1 "/Users/maurice/EPA/projects/theoriemeesters/mockups/pages/<pagename>/sections/"*.png 2>/dev/null | sort -V
```

**Section label** from filename: strip extension and leading `N. ` prefix, e.g. `3. Product Categories.png` → `Product Categories`.

**Do not** rely on plain alphabetical sort (`10.` before `2.`).

## Resolve WordPress page

1. If **`--post-id`** is set (e.g. **`1061`** for draft Home), use that `post_id` for all EMCP page tools.
2. Else **`emcp-tools-list-pages`** or search — match title to `pagename` (or `--title` if user provided).
3. Confirm Elementor content exists: **`emcp-tools-get-page-structure`** `{ "post_id": <id>, "summary": true }` — expect one top-level container (or ordered stack) per mockup section, in the same count/order as `sort -V` PNGs.
4. If section **count or order** does not match mockups, report mismatch; suggest re-assembly via **`/elementor-page-from-sections`** or manual reorder (`emcp-tools-reorder-elements` / `move-element`) before polishing.

Record front URL (draft preview, publish URL, or `?preview=true` as appropriate) for Browser DevTools MCP.

## Design tokens (cross-check)

| Source | Path (EPA) |
|--------|------------|
| Project token CSS | `projects/theoriemeesters/site.css` |
| Active child theme | `projects/theoriemeesters/hello-elementor-theoriemeesters/assets/tokens.css` |
| Live Elementor globals | `emcp-tools-get-global-settings` on dev1.dev045.nl |

Prefer **Elementor global colors/typography** and CSS variables from tokens over one-off hex when they match the mockup.

## Icons (SVG, not Font Awesome)

Use **`projects/theoriemeesters/assets/icons/`** (`tm-icon-*.svg` in media after upload). Upload once with **`emcp-tools-upload-svg-icon`**, then set Elementor icons to `library: "svg"` + shared attachment id via **`emcp-tools-update-element`**.

**Keep Font Awesome only where SVG broke the site:** nav menu `submenu_icon` (chevron), **Social Icons** brand glyphs, **star/rating** widgets, WooCommerce cart chrome.

Do not use invalid FA names (e.g. `fa-moped`); use `moped.svg` / `scooter.svg` from the icon set.

## Skills (load before polishing)

Call **`emcp-tools-get-skill`** for each slug (read and follow before any Elementor edits):

1. **`emcp-skills`** — Elementor MCP builder conventions
2. **`emcp-skills/audit`** — responsive controls, contrast, **visual review loop** (per-section screenshots, completeness checks)
3. **`emcp-skills/recipes`** — fix patterns for heroes, cards, FAQ, CTA strips, grids

Optionally **`emcp-plugins/addons`** if the section clearly uses EA/PA/UAE widgets.

## Pre-flight (site)

Confirm **which WordPress `post_id` you are polishing** (e.g. draft **1061**) vs the **front page** (`Settings → Reading`). Mockup parity on a draft does not change the live homepage until that page is published or set as the static front page.

After polish, sync child theme assets if classes depend on **`assets/site.css`** / **`assets/site-home.css`**: run **`/hello-elementor-child-theme-deploy`** (or `emcp-tools-write-file` for `wp-content/themes/hello-elementor-theoriemeesters/assets/*` and `functions.php`).

1. **`core-get-site-info`** — `{}` — confirm site URL.
2. **`emcp-tools-detect-elementor-version`** — note Pro/widgets available.
3. Resolve `sections/` path; run `sort -V` listing; record ordered filenames.
4. **`emcp-tools-get-page-structure`** on target `post_id` — map top-level section container `element_id`s to mockup index `1…N`.
5. Optional: **`emcp-tools-create-backup`** before large batch edits if the user cares about rollback.

## Section mapping (mockup ↔ live)

1. **`emcp-tools-get-page-structure`** — full or summary tree; list **top-level** containers/widgets in document order (exclude theme header/footer — page body only).
2. **`emcp-tools-get-page-snapshot`** — rendered HTML/CSS hints for structure.
3. Build a **mapping table** before the compare loop:

| Index | Mockup file | Section label | Live `element_id` (root) | Notes |
|-------|-------------|---------------|----------------------------|-------|
| 1 | `1. Hero.png` | Hero | … | |
| 2 | … | … | … | |

If live has extra/missing sections vs PNG count, stop and reconcile with the user (do not silently skip mockups).

Use **`emcp-tools-find-element`** when labels or widget types help locate the wrong node inside a section.

## Compare-and-fix loop (per section)

Process sections in **`sort -V` mockup order**. For each section `i`:

### A. Capture references

1. **Mockup:** Read the PNG with the Read tool (vision) — ground truth for layout, spacing, colors, type, copy, icons, imagery.
2. **Live:** Browser DevTools MCP — navigate to page URL, scroll section into view, optional **`browser_highlight`** on the section root if refs exist; **`browser_take_screenshot`** (crop mentally or full page + note vertical band). Alternatively supplement with **`emcp-tools-get-page-snapshot`** / **`get-page-html`** for copy and DOM structure.

### B. Diff spec (written before edits)

Compare mockup vs live and list concrete deltas, e.g.:

- Layout: columns, flex direction, alignment, max-width, padding, gap, background (color/image/overlay)
- Typography: size, weight, line-height, color, uppercase, font family (globals vs custom)
- Colors: buttons, links, borders, cards (map to globals when possible)
- Copy: headings, body, button labels, FAQ text — match mockup literally where legible
- Icons/images: wrong icon, missing SVG, wrong aspect ratio, placeholder vs sideloaded asset
- Components: wrong widget type, missing columns, slider settings, Woo product grid columns

Follow **`emcp-skills/audit`** for contrast and responsive gaps (desktop-first; fix tablet/mobile if mockup or audit implies it).

### C. Fix via EMCP

Apply minimal targeted changes:

| Need | Tools |
|------|--------|
| Locate nodes | **`emcp-tools-find-element`**, structure tree |
| Style/content | **`emcp-tools-update-element`**, **`emcp-tools-update-widget`**, **`emcp-tools-batch-update`** |
| Containers | **`emcp-tools-update-container`**, **`emcp-tools-add-container`**, **`emcp-tools-remove-element`**, **`emcp-tools-move-element`**, **`emcp-tools-reorder-elements`** |
| Globals | **`emcp-tools-update-global-colors`**, typography tools — only when mockup/system-wide |
| Media | **`emcp-tools-search-images`**, **`emcp-tools-sideload-image`**, **`emcp-tools-add-stock-image`** |
| Icons | **`emcp-tools-upload-svg-icon`** + icon settings on widgets |

After substantive CSS changes on a section, you may call **`emcp-tools-regenerate-css`** `{ "scope": "site", "confirm": true }` when permitted (once per batch of fixes, not every micro-tweak).

### D. Re-verify and iterate

1. Re-screenshot the same section (Browser DevTools MCP).
2. Re-read mockup if needed; update diff spec.
3. Repeat **B → C → D** until:
   - **Pass:** no material deltas remain, or only honest limits (stock photo vs mockup, illegible microcopy, font not installable), **or**
   - **`--max-iterations`** reached for this section — report remaining deltas and continue to next section.

Do **not** declare the full page done until every section has been through this loop (or hit max iterations with documented gaps).

## Workflow summary

1. **Parse input** — `pagename`, `--post-id`, `--sections-dir`, `--max-iterations`.
2. **Resolve paths** — `sort -V` mockup list; resolve WordPress `post_id`.
3. **Load skills** — `emcp-skills`, `emcp-skills/audit`, `emcp-skills/recipes`.
4. **Map sections** — structure/snapshot → mapping table mockup index ↔ `element_id`.
5. **Per-section loop** — vision + browser screenshot → diff spec → EMCP fixes → re-screenshot (≤ max iterations).
6. **`regenerate-css`** if many style changes accumulated.
7. **Final browser pass** — full-page and per-section screenshots vs PNGs in order.
8. **Success report** — honest remaining deltas per section.

## Success report

Tell the user:

- Slash command used, **`pagename`**, target **`post_id`**, page URL
- Resolved **`sections/`** path and ordered mockup list (`sort -V`)
- **`--max-iterations`** used and per-section iteration counts
- Mapping table (mockup ↔ `element_id`) in brief
- Fixes applied (high level per section)
- Verification (Browser DevTools MCP + optional snapshot)
- **Remaining deltas** (fonts, assets, responsive, content not legible on PNG)

## On failure

- **Missing `pagename` or sections folder** → ask for `--page` and path; do not invent mockups.
- **Page not found / wrong `post_id`** → list candidates; ask once.
- **Section count mismatch** → do not force-map; suggest **`/elementor-page-from-sections`** or reorder.
- **Draft front URL 404 for anonymous browser** → use logged-in preview, Elementor preview URL, or publish if user allows — document how you verified.
- **EMCP edit fails** → simplify change; use `batch-update` in smaller chunks; read tool error and adjust element id.
- **Vision/browser blocked** → use snapshot/HTML for structure; ask user to confirm preview access once.

## Related commands

- **`/elementor-page-from-sections`** — build page + section templates from the same mockup PNGs (run before this polish command if the page does not exist)
- **`/elementor-header-footer-from-images`** — site-wide header/footer from `Header.png` / `Footer.png` (not section body)
- **`/hello-elementor-child-theme`** — tokens + child theme scaffold
- **`/hello-elementor-child-theme-deploy`** — deploy child theme to the same EMCP site

## Example invocations

```text
/elementor-match-section-mockups --page Home --post-id 1061
Polish draft Home on dev1 against theoriemeesters section mockups; max 3 iterations per section.
```

```text
/elementor-match-section-mockups --page=Home --post-id 1061 --max-iterations 5
Use projects/theoriemeesters/mockups/pages/Home/sections; fix icons from assets/icons SVG set.
```

```text
/elementor-match-section-mockups --page Home --post-id 1061 --sections-dir projects/theoriemeesters/mockups/pages/Home/sections
Compare and fix until visual match; report any section that still diverges after max iterations.
```
