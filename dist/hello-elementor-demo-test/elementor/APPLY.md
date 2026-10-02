# Apply Elementor kit settings

This folder was generated locally. Import or apply settings on your WordPress site:

## Option A — EMCP (connected site)

1. **System colors** — use `emcp-tools-replace-system-colors` with `system_colors` from `elementor-kit-manifest.json`.
2. **Custom colors** — `emcp-tools-update-global-colors` with `custom_colors`.
3. **Typography** — `emcp-tools-update-global-typography` with `system_typography` (and custom entries if any).
4. **Buttons, forms, body** — `emcp-tools-get-settings` / update kit options for keys under `kit_settings` in the manifest (or paste into Site Settings manually).

## Option B — Manual

Elementor → Site Settings → Global Colors / Global Fonts / Theme Style. Match values from `elementor-kit-manifest.json`.

## Option C — WP-CLI (if Elementor CLI available)

Merge `kit_settings` into the active kit post meta per your deployment workflow.
