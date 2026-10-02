---
description: Build a full Elementor page from ordered section mockup PNGs via EMCP (section templates + stacked page)
---

# Elementor page from section mockups (EMCP)

You are invoked via **`/elementor-page-from-sections`** in Cursor chat. For a named page, read every section mockup PNG in that page’s `sections/` folder (in **natural filename order**), build matching Elementor **section templates** on the EMCP-connected WordPress site, then create a WordPress page that **stacks those sections** top-to-bottom in the same order.

**MCP namespace:** `project-0-EPA-emcp-dev1-dev045-nl`  
Use `GetDynamicTools` on that namespace if a tool schema is unclear, then `CallDynamicTool` to invoke.

**Browser verification:** For final visual checks on the live page, use **Browser DevTools MCP** only (not Cursor’s built-in browser). Prefer batched `execute` flows for multi-step checks.

**Do not** push Appwrite or run `appwrite push`. **Do not** create a git commit unless the user explicitly asks.

## Page name (required)

Resolve the page slug/title from the user’s message. Accept any of:

| Form | Example |
|------|---------|
| Flag | `/elementor-page-from-sections --page Home` |
| Flag with `=` | `/elementor-page-from-sections --page=Home` |
| Key phrase | `pagename: Home` or `page: Home` |
| Bare name after command | `/elementor-page-from-sections Home` (only if unambiguous) |

**`pagename`** is the folder name under `pages/` (case-sensitive on disk; e.g. `Home` not `home` unless that folder exists). Use it for:

- Filesystem path: `.../pages/<pagename>/sections/`
- WordPress page **title** (default: same as `pagename`; user may override with `--title "..."` if they ask)
- Template naming prefix: `<pagename> — Section: <section label>`

If `--page` / `pagename` is missing, stop once and ask the user (e.g. `--page Home`).

## Section mockup paths

Always resolve paths under the EPA workspace root: `/Users/maurice/EPA`.

> User typo **`pafes`** → always use **`pages`**.

### Directory layout (reference)

Example in this repo:

```text
projects/theoriemeesters/mockups/pages/
└── Home/
    └── sections/
        ├── 1. Hero.png
        ├── 2. USPs.png
        ├── 3. Product Categories.png
        ├── 4. Featured Products.png
        ├── 5. Online Oefenen.png
        ├── 6. Ervaringen.png
        ├── 7. Zo werkt het.png
        ├── 8. Veelgestelde vragen.png
        └── 9. CTA.png
```

### Resolution order

Search for section PNGs in this order; use the **first** directory that exists and contains at least one `*.png`:

1. **User override** — `--sections-dir /absolute/or/relative/path` or an `@`-mentioned folder in chat
2. **Project mockups (default for theoriemeesters)** —  
   `projects/theoriemeesters/mockups/pages/<pagename>/sections/`
3. **EPA generic** — `pages/<pagename>/sections/` (under EPA root)
4. **User attachments** — if the user attached section PNGs without a folder, sort those files with the same natural-sort rule (below) and treat as the section list

**If no images are found:** stop once; ask the user to confirm `pagename` and path (e.g. `projects/theoriemeesters/mockups/pages/Home/sections/`).

### Listing and sort order (critical)

Sections must be built and assembled in **natural (version) sort** of filenames so numeric prefixes order correctly:

- `1. Hero.png` → `2. USPs.png` → … → `9. CTA.png` → `10. Footer.png` (if present)

**Do not** rely on plain alphabetical sort (`10.` before `2.`).

From EPA root, list files in order:

```bash
ls -1 "/Users/maurice/EPA/projects/theoriemeesters/mockups/pages/<pagename>/sections/"*.png 2>/dev/null | sort -V
```

Adjust the path to the resolved `sections/` directory. Record the ordered list in the build spec before building.

**Section label** for templates and logs: derive from the filename (strip extension and leading `N. ` prefix), e.g. `3. Product Categories.png` → `Product Categories`.

## Design tokens (cross-check)

Before setting colors and typography, align with site tokens when available:

| Source | Path (EPA) |
|--------|------------|
| Project token CSS | `projects/theoriemeesters/site.css` |
| Active child theme | `projects/theoriemeesters/hello-elementor-theoriemeesters/assets/tokens.css` |
| Live Elementor globals | `emcp-tools-get-global-settings` on dev1.dev045.nl |

Prefer **Elementor global colors/typography** and CSS variables from tokens over one-off hex values when they match the mockup.

## Icons (SVG, not Font Awesome)

Use **`projects/theoriemeesters/assets/icons/`** (`tm-icon-*.svg` in media after upload). Upload once with **`emcp-tools-upload-svg-icon`**, then set Elementor icons to `library: "svg"` + shared attachment id via **`emcp-tools-update-element`** (icon list, buttons, icon boxes).

**Keep Font Awesome only where SVG broke the site:** nav menu `submenu_icon` (chevron), **Social Icons** brand glyphs, **star/rating** widgets, WooCommerce cart chrome.

Do not use invalid FA names (e.g. `fa-moped`); use `moped.svg` / `scooter.svg` from the icon set.

## Skills (load before building)

Call **`emcp-tools-get-skill`** for each slug (read and follow before any Elementor work):

1. **`emcp-skills`** — Elementor MCP builder conventions
2. **`emcp-skills/recipes`** — heroes, cards, FAQ, CTA strips, grids
3. **`emcp-skills/audit`** — responsive controls, contrast, visual review loop

Optionally **`emcp-plugins/addons`** if mockups clearly need EA/PA/UAE widgets.

## Pre-flight (site)

1. **`core-get-site-info`** — `{}` — confirm site URL.
2. **`emcp-tools-detect-elementor-version`** — note Pro/widgets available.
3. **`emcp-tools-list-templates`** — `{ "template_type": "section" }` — avoid duplicate titles; plan update vs new section templates.
4. Confirm resolved `sections/` path exists and `sort -V` file list is non-empty (Read tool supports vision on each PNG).

## Recommended EMCP pattern: section templates + stacked page

Use **per-section scratch pages → save as section template → assemble final page with `apply-template`**. This matches the template library, keeps each mockup isolated, and preserves order on the final page.

| Step | Tool | Role |
|------|------|------|
| Scratch page | **`emcp-tools-create-page`** | `{ "title": "<pagename> — Build: <section label>", "status": "draft" }` |
| Build section | **`emcp-tools-build-page`** *or* **`emcp-tools-add-container`** + **`emcp-tools-add-free-widget`** / **`emcp-tools-add-pro-widget`** + **`emcp-tools-update-element`** / **`emcp-tools-batch-update`** | Prefer **`build-page`** on the scratch `post_id` only when creating a new page in one shot; for an existing scratch page, use container/widget tools on that `post_id` |
| Root element id | **`emcp-tools-get-page-structure`** | `{ "post_id": <scratch>, "summary": true }` — top-level container id for the section |
| Save library template | **`emcp-tools-save-as-template`** | `{ "post_id": <scratch>, "element_id": "<root_container_id>", "title": "<pagename> — Section: <label>", "template_type": "section" }` |
| Final page | **`emcp-tools-create-page`** | `{ "title": "<pagename>", "status": "draft" }` (or `publish` if user asks) |
| Stack sections | **`emcp-tools-apply-template`** | For each saved template **in sort order**: `{ "post_id": <final>, "template_id": <library_post_id>, "position": -1 }` — **one call at a time**; wait for success before the next (parallel calls race and can drop sections) |
| List / reuse | **`emcp-tools-list-templates`** | `{ "template_type": "section" }` |
| Images | **`emcp-tools-search-images`**, **`emcp-tools-sideload-image`**, **`emcp-tools-add-stock-image`** | Stock assets when mockup photos are placeholders |
| Patterns (optional) | **`emcp-tools-list-patterns`**, **`emcp-tools-insert-pattern`** | Only for Gutenberg/block pages — **not** the default for Elementor section builds |
| Import JSON (optional) | **`emcp-tools-import-template`** | If user supplies Elementor JSON instead of building from vision |
| Styles | **`emcp-tools-regenerate-css`** | `{ "scope": "site", "confirm": true }` after substantive changes |
| Snapshot | **`emcp-tools-get-page-snapshot`** | Compare structure to mockups |
| Backup (optional) | **`emcp-tools-create-backup`** | Before overwriting an existing page the user cares about |

**`emcp-tools-build-page` note:** Best for a **new** page with a full `structure` array in one call. For the scratch-per-section flow, either create the scratch page with `create-page` then add a single top-level section via `add-container` + widgets, or use `build-page` with a unique scratch title per section. Use `dry_run: true` on large structures before committing.

**Cleanup:** Leave scratch draft pages as drafts or trash them via WP only if the user wants a tidy library; section templates in the library are the durable artifacts.

### Alternative (single page, no library)

If the user explicitly wants **no** saved templates, build each section as a **top-level container** on one `post_id` using **`emcp-tools-add-container`** in order (still follow the same PNG sort order). Default remains **section templates + apply-template** unless the user opts out.

## Workflow

### 1. Parse input and resolve paths

- Extract `pagename` (and optional `--sections-dir`, `--title`, `--status publish`).
- Resolve `sections/` and run `sort -V` listing; write ordered filenames and labels.

### 2. Analyze mockups (vision)

For **each** PNG in order (Read tool):

- Layout: columns, alignment, max-width, padding, gaps, background (color/image)
- Typography and colors (map to globals/tokens)
- Copy: headings, body, buttons, labels (exact text where legible)
- Components: cards, sliders, FAQ, forms, product grids (note WooCommerce if applicable)
- Responsive: desktop-first; tablet/mobile per **`emcp-skills/audit`**

Produce a short **build spec** (ordered bullets, one per section) before editing the site.

### 3. Build section templates (in sort order)

For each section image:

1. Create scratch draft page (`create-page`).
2. Build content to match the PNG (containers/widgets; use recipes skill for common patterns).
3. `get-page-structure` → root container `element_id`.
4. `save-as-template` with `template_type: "section"` and title `<pagename> — Section: <label>`.
5. Record `template_id` (library post id) in a table for assembly.

If a template with the same title already exists, either update that section’s scratch build and save under a versioned title, or ask the user once whether to replace.

### 4. Assemble the WordPress page

1. `create-page` for the final page title (default `pagename`).
2. Loop sorted `template_id`s: `apply-template` with `position: -1` to append (**sequential only** — never batch parallel `apply-template` on the same `post_id`).
3. `regenerate-css` if styles changed materially.
4. `get-page-snapshot` on the final `post_id`.

### 5. Verify (Browser DevTools MCP)

1. Open the page front URL (draft preview or published URL per status).
2. Screenshot full page and key sections; compare to section PNGs in order.
3. Fix spacing/colors/copy gaps via `update-element` / `batch-update`; re-verify once.

Report honest deltas (fonts, stock vs mockup photos, illegible microcopy).

## Success report

Tell the user:

- Slash command used and **`pagename`**
- Resolved **`sections/`** path and ordered file list
- Sort rule used (`sort -V` / natural order)
- Final page title, `post_id`, status, and URL
- Section template titles and `template_id`s (in stack order)
- Token sources (`site.css`, `tokens.css`, globals)
- Verification (snapshot + browser)
- Optional: scratch draft pages left on site

## On failure

- **Missing `pagename` or sections folder** → ask for `--page` and path; do not invent sections.
- **Empty `sections/`** → report path checked; ask for PNGs or `--sections-dir`.
- **EMCP timeout on huge `build-page`** → use `dry_run: true`, simplify structure, or build with `add-container` + widgets in smaller steps.
- **Duplicate headers/footers** → page body only; site header/footer come from theme templates (see **`/elementor-header-footer-from-images`**).
- **Visual mismatch** → audit skill checklist; iterate per section.
- **Missing sections after assembly** → re-run `get-page-structure` / snapshot; clear page content if needed and re-apply templates **one by one** in sort order.
- **Draft front URL 404** → expected for anonymous users; verify in Elementor (`wp-admin/post.php?post=<id>&action=elementor`) or publish / logged-in preview — not a failed build by itself.

## Related commands

- **`/elementor-match-section-mockups`** — iterative compare-and-fix on an **existing** page vs the same section PNGs (after build or for polish)
- **`/elementor-header-footer-from-images`** — site-wide header/footer from `Header.png` / `Footer.png`
- **`/hello-elementor-child-theme`** — tokens + child theme scaffold
- **`/hello-elementor-child-theme-deploy`** — deploy child theme to the same EMCP site

## Example invocations

```text
/elementor-page-from-sections --page Home
Build on dev1 from theoriemeesters mockups; leave page as draft.
```

```text
/elementor-page-from-sections --page=Home pagename: Home
Use projects/theoriemeesters/site.css tokens; publish when done.
```

```text
/elementor-page-from-sections --page Home --sections-dir projects/theoriemeesters/mockups/pages/Home/sections
```
