---
description: Build Elementor header and footer theme templates on dev1 via EMCP to match reference PNG mockups
---

# Elementor header & footer from reference images (EMCP)

You are invoked via **`/elementor-header-footer-from-images`** in Cursor chat. Replicate the user’s **header** and **footer** reference images as Elementor **theme templates** on the EMCP-connected WordPress site, as closely as practical (structure, spacing, colors, typography, logo, nav, CTAs, columns, social icons).

**MCP namespace:** `project-0-EPA-emcp-dev1-dev045-nl`  
Use `GetDynamicTools` on that namespace if a tool schema is unclear, then `CallDynamicTool` to invoke.

**Browser verification:** For final visual checks on the live site, use **Browser DevTools MCP** only (not Cursor’s built-in browser). Prefer batched `execute` flows for multi-step checks.

**Do not** push Appwrite or run `appwrite push`. **Do not** create a git commit unless the user explicitly asks.

## Reference images (required)

The workflow expects **two** PNG mockups:

| Role | Typical filename | What to extract |
|------|------------------|-----------------|
| Header | `Header.png` | Logo placement, primary/secondary nav labels and order, CTA button(s), top bar, icons, background, borders, sticky behavior hints |
| Footer | `Footer.png` | Columns, links, legal line, social icons, newsletter/form, background, dividers |

### Locating images

Search and load images in this order:

1. Paths in the user’s message after the slash command
2. Files attached to chat or `@`-mentioned paths
3. Common EPA paths (verify with Read — supports vision):
   - `/Users/maurice/EPA/Header.png`, `/Users/maurice/EPA/Footer.png`
   - `/Users/maurice/EPA/projects/theoriemeesters/mockups/Header.png`, `.../Footer.png`
   - User attachment or Cursor asset folders if the user pasted images in a prior turn

**If either image is missing or unreadable:** stop once and ask the user to attach both PNGs or provide absolute paths (e.g. `@/path/to/Header.png` and `@/path/to/Footer.png`). Do not guess layout from memory.

> **Repo note:** As of command authoring, `Header.png` / `Footer.png` were **not** present under `/Users/maurice/EPA`; always confirm paths at invocation time.

## Design tokens (cross-check)

Before setting colors and typography on templates, align with site tokens when available:

| Source | Path (EPA) |
|--------|------------|
| Project token CSS | `projects/theoriemeesters/site.css` |
| Active child theme | `projects/theoriemeesters/hello-elementor-theoriemeesters/assets/tokens.css` |
| Live Elementor globals | `emcp-tools-get-global-settings` on dev1.dev045.nl |

Prefer **Elementor global colors/typography** and CSS variables from tokens over one-off hex values when they match the mockup. Use custom values only where the reference image clearly diverges.

**Icons:** upload from **`projects/theoriemeesters/assets/icons/`** via **`emcp-tools-upload-svg-icon`**; prefer SVG over Font Awesome except nav submenu chevron, social brand widget, ratings, and Woo cart (see **`/elementor-page-from-sections`** icons section).

## Skills (load before building)

Call **`emcp-tools-get-skill`** for each slug (read and follow before any template work):

1. **`emcp-skills`** — Elementor MCP builder conventions
2. **`emcp-themer`** — theme templates (header/footer), conditions, structure
3. Optionally **`emcp-skills/recipes`** — nav bars, trust rows, multi-column footers
4. Optionally **`emcp-skills/audit`** — responsive controls, contrast, visual review loop

## Pre-flight (site)

1. **`core-get-site-info`** — `{}` — confirm site URL (expect dev1.dev045.nl or configured EMCP target).
2. **`emcp-tools-detect-elementor-version`** — note Pro features (theme builder) if needed.
3. **`emcp-tools-list-templates`** or theme-template listing tools — see existing header/footer templates; plan **create** vs **update** (avoid duplicate site-wide headers).

## Workflow

### 1. Analyze mockups (vision)

For **each** PNG (Read tool):

- Document layout: sections, columns, alignment, max-width, padding, gaps
- Colors: backgrounds, text, links, buttons, borders (map to globals where possible)
- Typography: families, sizes, weights, letter-spacing, uppercase
- Assets: logo (text vs image), icons, social networks, imagery
- Interactive elements: menu items (exact labels and order), button copy, form fields
- Responsive hints: stacked vs inline, hidden items (implement desktop-first; add tablet/mobile breakpoints per `emcp-skills/audit`)

Produce a short **build spec** (bullet list) for header and footer before touching the site.

### 2. Header theme template

1. **`emcp-tools-create-elementor-theme-template`** — type **header** (or update existing header template id if replacing).
2. Build structure with **`emcp-tools-build-page`**, **`emcp-tools-add-container`**, **`emcp-tools-add-free-widget`** / **`emcp-tools-add-pro-widget`**, **`emcp-tools-update-element`**, **`emcp-tools-batch-update`** as needed.
   - Use native Elementor nav/menu, logo, button, icon, and social widgets where possible (avoid HTML soup unless recipes require it).
3. **`emcp-tools-set-elementor-template-conditions`** — display on **Entire Site** (all pages). Ensure no conflicting second header remains active site-wide.
4. If the site uses Ultimate Addons / theme parts elsewhere, check **`emcp-tools-uae-read`** only if mockup matches HFE-style headers.

### 3. Footer theme template

Same pattern as header:

1. Create or update **footer** theme template.
2. Match column structure, widgets, and styles to `Footer.png`.
3. Set conditions to **Entire Site**.
4. Remove or demote duplicate footers (old template conditions or theme default footer if EMCP/themer tools allow).

### 4. Globals and CSS

- If mockup colors/type are not in globals: **`emcp-tools-update-global-colors`**, **`emcp-tools-replace-system-colors`**, typography tools — only when needed for fidelity and consistent with tokens.
- **`emcp-tools-regenerate-css`** — `{ "scope": "site", "confirm": true }` after substantive style changes.

### 5. Verify

1. **`emcp-tools-get-page-snapshot`** — home or a representative page; compare structure to mockups.
2. **Browser DevTools MCP** — open the site front URL, screenshot header and footer regions, compare to the reference PNGs. Fix gaps (spacing, font size, colors, alignment) and re-verify once.

Report remaining visual deltas honestly (font substitution, image assets not yet uploaded, etc.).

## Success report

Tell the user:

- Site URL and that header/footer apply **Entire Site**
- Template names/ids (header + footer) and whether created or updated
- Paths to reference images used
- Token sources used (`site.css`, `tokens.css`, globals)
- Verification method (snapshot + browser screenshots)
- Any follow-ups (upload logo SVG, wire menu to WP menu, legal copy)

## On failure

- **Missing images** → request attachments/paths; do not fabricate layout.
- **Theme builder / Pro** unavailable → report from `detect-elementor-version` / list templates; stop.
- **Condition conflicts** → list templates with `list-templates`; adjust conditions so exactly one header and one footer are site-wide.
- **`set-elementor-template-conditions` MCP error** → confirm templates still render (`get-page-html` / front URL for `elementor-location-header` and `elementor-location-footer`); fix conditions in Elementor Theme Builder UI if locations are missing.
- **Visual mismatch** → iterate widgets/styles; use audit skill contrast/spacing checklist before declaring done.

## Related commands

- **`/hello-elementor-child-theme`** — scaffold child theme + kit manifest from CSS tokens.
- **`/hello-elementor-child-theme-deploy`** — upload/activate child theme on the same EMCP site.

## Example invocation (when images exist locally)

```text
/elementor-header-footer-from-images
@/Users/maurice/EPA/projects/theoriemeesters/Header.png
@/Users/maurice/EPA/projects/theoriemeesters/Footer.png
Use theoriemeesters tokens; replace any existing site-wide header/footer on dev1.
```
