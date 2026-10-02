---
description: Upload and activate a generated Hello Elementor child theme on the EMCP-connected WordPress site
---

# Deploy Hello Elementor child theme (EMCP)

You are invoked via **`/hello-elementor-child-theme-deploy`** in Cursor chat. Upload the local child theme folder to the connected WordPress site and **activate** it using EMCP — not manual FTP/SFTP unless EMCP fails after a documented retry.

**MCP namespace:** `project-0-EPA-emcp-dev1-dev045-nl`  
Use `GetDynamicTools` on that namespace if a tool schema is unclear, then `CallDynamicTool` to invoke.

**Do not** push Appwrite or run `appwrite push`. **Do not** create a git commit unless the user explicitly asks.

## Inputs

Resolve from the user’s message (paths, `@` mentions, open files, or follow-up to **`/hello-elementor-child-theme`**):

| Input | Rule |
|-------|------|
| **Local theme folder** | Absolute or repo-relative path. Example: `projects/theoriemeesters/hello-elementor-theoriemeesters` under `/Users/maurice/EPA`. |
| **Theme slug** | Default: **basename of the folder** (e.g. `hello-elementor-theoriemeesters`). Must match the folder name on the server: `wp-content/themes/<slug>/`. |
| **Site** | Whatever site the EMCP server is configured for (no manual host switching in this command). |

If the folder path is missing, ask once for the path to the generated child theme directory.

## Pre-flight (local)

From the EPA project root, verify before any upload:

1. **`style.css`** exists and its header includes **`Template: hello-elementor`** (case-sensitive).
2. **`functions.php`** exists.
3. Note optional paths to upload: `assets/**`, `elementor/**` (manifest only; do not apply globals unless the user separately asks — point them to `elementor/APPLY.md` or **`/hello-elementor-child-theme`** “Apply manifest” section).

Read `style.css` locally and confirm `Theme Name` / slug consistency. **State the slug and remote path** (`wp-content/themes/<slug>/`) to the user before writing files.

## Discover remote paths

1. **`core-get-site-info`** — `{}` — confirm site URL/name for the success report.
2. **`emcp-tools-list-directory`** — `{ "path": "wp-content/themes" }` — see installed theme folders; confirm parent **`hello-elementor`** is present (child themes require it).
3. If **`hello-elementor`** is missing: **`emcp-tools-install-theme`** — `{ "slug": "hello-elementor" }` — then re-list themes.

Remote paths for file tools are **relative to the WordPress root** (e.g. `wp-content/themes/<slug>/style.css`).

## Upload strategy

EMCP has **no single “upload directory”** tool. Use **ZIP install** (preferred when many files) or **per-file write** (always works if file editing is enabled).

### A. ZIP install (preferred)

1. On the client, create a ZIP with **one top-level folder** named `<slug>/` containing `style.css`, `functions.php`, etc. (WordPress theme install rejects a flat archive with files at the ZIP root). Example: `cd <parent-of-theme> && zip -r <slug>.zip <slug>/`.
2. Compute **SHA-256** of the ZIP (e.g. `shasum -a 256 theme.zip`).
3. **`emcp-tools-upload-media`** — `{ "filename": "<slug>.zip", "data": "<base64>" }` — returns `attachment_id` (or equivalent id field in the response).
4. **`emcp-tools-install-theme`** — `{ "zip_attachment_id": <id>, "expected_sha256": "<hex>", "confirm": true, "activate": true, "delete_zip_after_install": true }`  
   - `confirm` must be `true` for uploaded ZIPs (executable code).  
   - If you prefer activate in a separate step, set `activate: false` and use switch-theme below.

### B. Per-file upload (fallback or small themes)

For each file under the local theme folder (at minimum `style.css`, `functions.php`, `assets/tokens.css` if referenced):

1. Read file contents locally (Shell `cat` or Read tool).
2. **`emcp-tools-write-file`** — `{ "path": "wp-content/themes/<slug>/<relative-path>", "content": "<file contents>" }`  
   - Creates/overwrites; backs up existing files. Refuses `wp-config.php` / `.htaccess`. Requires file editing enabled on the site.

**Agent loop:** walk the local tree (skip `.DS_Store`, `node_modules`, `.git`). Upload subdirs: `assets/*`, `elementor/*` (JSON/docs only — no auto-apply of kit globals).

After writes, optionally **`emcp-tools-read-file`** — `{ "path": "wp-content/themes/<slug>/style.css", "limit": 20 }` — confirm remote header.

## Install / activate

1. **`emcp-tools-list-themes`** — `{}` — confirm `<slug>` appears with parent `hello-elementor` (or `template: hello-elementor` in response fields).
2. If the theme is installed but not active: **`emcp-tools-switch-theme`** — `{ "stylesheet": "<slug>" }`  
   - `stylesheet` is the theme **folder** name, not the display name.
3. If ZIP path used `activate: true`, still verify with `list-themes` that the child is active.

## Success report

Tell the user:

- Site URL (from `core-get-site-info`)
- Slug and remote path
- Upload method (ZIP vs per-file)
- Active theme confirmation from `list-themes`
- Reminder: Elementor kit globals are **not** applied by this command; to apply `elementor/elementor-kit-manifest.json`, they must ask explicitly (see `elementor/APPLY.md` in the theme folder or the apply section in **`/hello-elementor-child-theme`**)

## On failure

- **`emcp-tools-write-file` disabled** → use ZIP path via `upload-media` + `install-theme`, or report that file editing must be enabled on the EMCP site.
- **switch-theme refuses** (load errors) → `read-file` remote `style.css` / `functions.php`; fix local sources and re-upload.
- **ZIP install fails** (hash mismatch, invalid structure) → rebuild ZIP with a single `<slug>/` folder at the archive root; recompute SHA-256.
- Only after EMCP is exhausted: suggest manual copy to `wp-content/themes/<slug>/` and activate in WP admin — do not use FTP unless the user requests it.

## Related commands

- **`/hello-elementor-child-theme`** — generate the local child theme + manifest from CSS tokens.
- This command — **deploy + activate** only.
