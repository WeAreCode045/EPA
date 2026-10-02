# Apply Elementor kit settings

This folder was generated locally. Import or apply settings on your WordPress site:

## Option A — EMCP (connected site)

1. **System colors** — `emcp-tools-replace-system-colors` with `system_colors` from `elementor-kit-manifest.json`.
2. **Custom colors** — `emcp-tools-update-global-colors` with `custom_colors` (upsert only; remove stale IDs manually in Site Settings if needed).
3. **System typography** — `emcp-tools-replace-system-typography` with `system_typography` from the manifest. On some sites `emcp-tools-update-global-typography` only touches custom slots; do not rely on it for primary/secondary/text/accent.
4. **Custom typography** — `emcp-tools-update-global-typography` with `custom_typography` when the manifest includes entries.
5. **Buttons, forms, body, headings** — merge `kit_settings` via `emcp-tools-update-page-settings` on the active kit post (from `emcp-tools-get-global-settings`), or paste into Elementor Site Settings manually.
6. **CSS** — `emcp-tools-regenerate-css` with `scope: "site"`, `confirm: true` after globals change.

## Option B — Manual

Elementor → Site Settings → Global Colors / Global Fonts / Theme Style. Match values from `elementor-kit-manifest.json`.

## Option C — WP-CLI (if Elementor CLI available)

Merge `kit_settings` into the active kit post meta per your deployment workflow.
