---
description: Scaffold a Hello Elementor child theme and Elementor kit manifest from CSS design tokens
---

# Hello Elementor child theme from CSS tokens

You are invoked via **`/hello-elementor-child-theme`** in Cursor chat. This is the primary entry point; run the generator yourself — do not tell the user to run npm unless they explicitly want manual CLI usage.

## Your workflow

1. **CSS token sources** — Collect one or more `.css` files with design tokens (`:root { --color-*; --font-*; }`):
   - Paths in the user’s message after the slash command
   - Files the user attached or has open in the editor
   - `@`-mentioned paths in chat
   - If nothing is provided, ask for token CSS paths. Use `scripts/hello-elementor-child-theme/example-tokens.css` only when the user agrees to a demo or explicitly wants a dry run.

2. **Options** — Resolve (ask only for what is missing):
   - **Theme name** (`--name`)
   - **Slug** (`--slug`, default: `hello-elementor-child`)
   - **Output directory** (`--out`, default: `./<slug>`)

3. **Run the generator** — From the EPA project root (`/Users/maurice/EPA`), execute:

   ```bash
   npm run hello-elementor-child -- \
     --name "<Theme Name>" \
     --slug <slug> \
     --out <absolute-or-relative-out> \
     --css <path1> [<path2> ...]
   ```

   Use absolute paths for `--css` when paths come from attachments outside the repo. Confirm each CSS file exists before running.

4. **Report** — After a successful run, tell the user:
   - Output directory and key files created
   - Which token CSS file(s) were used
   - Approximate counts of mapped colors and typography (from CLI output if present)
   - Next steps: run **`/hello-elementor-child-theme-deploy`** with the output folder (EMCP upload + activate), or copy manually to `wp-content/themes/<slug>/`; optionally apply `elementor/elementor-kit-manifest.json` (see below)

5. **On failure** — Show the CLI stderr/stdout, fix obvious path issues, and retry once if appropriate.

## What gets created

| Path | Purpose |
|------|---------|
| `style.css` | Child theme header + `Template: hello-elementor` |
| `functions.php` | Enqueues parent style, `assets/tokens.css`, child `style.css`; optional Google Fonts from manifest |
| `assets/tokens.css` | `:root` copy of parsed custom properties |
| `elementor/elementor-kit-manifest.json` | `system_colors`, `custom_colors`, `system_typography`, `custom_typography`, `kit_settings` |
| `elementor/APPLY.md` | How to apply manifest on a live site |

Deploy: **`/hello-elementor-child-theme-deploy`** with the output folder, or copy to `wp-content/themes/<slug>/` and activate in WordPress.

## Elementor globals mapped from CSS

| CSS token patterns | Elementor target |
|--------------------|------------------|
| `--color-primary`, `brand`, `navy`, … | System color **primary** |
| `--color-secondary`, … | System color **secondary** |
| `--color-text`, `body`, `foreground` | System color **text** |
| `--color-accent`, `cta`, `highlight` | System color **accent** |
| Other hex/`--color-*` vars | **custom_colors** (`emcp-tools-update-global-colors`) |
| `--font-family-*`, sizes, weights, line-heights | **system_typography** (primary / secondary / text / accent) |
| Extra font groups | **custom_typography** in manifest |
| `--button-*` | `button_*` kit settings (colors, radius, typography) |
| `--form-*`, `--input-*` | `form_field_*`, `form_label_*` |
| `--container-width` | `container_width` |
| Body tokens | `body_color`, `body_typography_*`, `h1_*`, `h2_*` |

## Apply manifest to live site (only if user asks)

Do **not** push globals without explicit confirmation. When requested and EMCP is connected:

1. `emcp-tools-replace-system-colors` — `system_colors` from manifest
2. `emcp-tools-update-global-colors` — `custom_colors` as `colors` array
3. `emcp-tools-replace-system-typography` — `system_typography` (not `update-global-typography` for system slots)
4. `emcp-tools-update-global-typography` — `custom_typography` when present
5. Merge `kit_settings` via `emcp-tools-update-page-settings` on the active kit post
6. `emcp-tools-regenerate-css` — `scope: "site"`, `confirm: true`

Reference: `elementor/APPLY.md` in the generated theme.

## Implementation detail (agent only)

CLI entry: `scripts/hello-elementor-child-theme/index.mjs` (also wired as `npm run hello-elementor-child`). Multiple CSS files: repeat `--css` or pass positional `.css` paths to the script.
