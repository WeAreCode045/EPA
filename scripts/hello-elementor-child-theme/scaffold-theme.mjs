import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PARENT_THEME = "hello-elementor";

/**
 * @param {{ themeName: string, themeSlug: string, description?: string, author?: string }} options
 */
export function buildStyleCssHeader(options) {
  const { themeName, themeSlug, description = "", author = "" } = options;
  return `/*
Theme Name: ${themeName}
Theme URI: https://elementor.com/hello-theme/
Description: ${description || `Child theme for ${PARENT_THEME}, generated from design tokens.`}
Author: ${author}
Author URI: https://elementor.com/
Template: ${PARENT_THEME}
Version: 1.0.0
Requires at least: 6.0
Tested up to: 6.8
Requires PHP: 7.4
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${themeSlug}
*/

/* Token variables are loaded from assets/tokens.css via functions.php */
`;
}

/**
 * @param {string} themeSlug
 */
export function buildFunctionsPhp(themeSlug) {
  const functionPrefix = themeSlug.replace(/-/g, "_");
  return `<?php
/**
 * ${themeSlug} child theme bootstrap.
 *
 * @package ${themeSlug}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( '${functionPrefix.toUpperCase()}_VERSION', '1.0.0' );

/**
 * Enqueue parent and child styles (and token CSS).
 */
function ${functionPrefix}_enqueue_styles() {
	$parent_handle = 'hello-elementor';
	$parent_theme  = wp_get_theme( '${PARENT_THEME}' );
	$parent_ver    = $parent_theme->exists() ? $parent_theme->get( 'Version' ) : false;

	wp_enqueue_style(
		$parent_handle,
		get_template_directory_uri() . '/style.css',
		array(),
		$parent_ver
	);

	wp_enqueue_style(
		'${themeSlug}-tokens',
		get_stylesheet_directory_uri() . '/assets/tokens.css',
		array( $parent_handle ),
		${functionPrefix.toUpperCase()}_VERSION
	);

	wp_enqueue_style(
		'${themeSlug}-style',
		get_stylesheet_directory_uri() . '/style.css',
		array( '${themeSlug}-tokens' ),
		${functionPrefix.toUpperCase()}_VERSION
	);
}
add_action( 'wp_enqueue_scripts', '${functionPrefix}_enqueue_styles', 20 );

/**
 * Optional: enqueue Google Fonts referenced in tokens (filter to extend).
 *
 * @param string[] $font_families Font family names.
 */
function ${functionPrefix}_enqueue_fonts( $font_families ) {
	if ( empty( $font_families ) ) {
		return;
	}

	$families = array();
	foreach ( $font_families as $family ) {
		$slug       = str_replace( ' ', '+', trim( $family ) );
		$families[] = $slug . ':wght@400;500;600;700';
	}

	$query = implode( '&family=', array_unique( $families ) );
	wp_enqueue_style(
		'${themeSlug}-fonts',
		'https://fonts.googleapis.com/css2?family=' . $query . '&display=swap',
		array(),
		null
	);
}

/**
 * Load fonts from elementor-kit-manifest.json when present.
 */
function ${functionPrefix}_maybe_enqueue_kit_fonts() {
	$manifest_path = get_stylesheet_directory() . '/elementor/elementor-kit-manifest.json';
	if ( ! is_readable( $manifest_path ) ) {
		return;
	}

	$raw      = file_get_contents( $manifest_path );
	$manifest = json_decode( $raw, true );
	if ( ! is_array( $manifest ) ) {
		return;
	}

	$families = array();
	if ( ! empty( $manifest['system_typography'] ) ) {
		foreach ( $manifest['system_typography'] as $row ) {
			if ( ! empty( $row['typography_font_family'] ) ) {
				$families[] = $row['typography_font_family'];
			}
		}
	}
	if ( ! empty( $manifest['custom_typography'] ) ) {
		foreach ( $manifest['custom_typography'] as $row ) {
			if ( ! empty( $row['typography_font_family'] ) ) {
				$families[] = $row['typography_font_family'];
			}
		}
	}

	${functionPrefix}_enqueue_fonts( array_unique( $families ) );
}
add_action( 'wp_enqueue_scripts', '${functionPrefix}_maybe_enqueue_kit_fonts', 15 );
`;
}

/**
 * @param {string} outDir
 * @param {{
 *   themeName: string,
 *   themeSlug: string,
 *   description?: string,
 *   author?: string,
 *   tokensCss: string,
 *   elementorManifest: object,
 * }} payload
 */
export function writeChildTheme(outDir, payload) {
  const {
    themeName,
    themeSlug,
    description,
    author,
    tokensCss,
    elementorManifest,
  } = payload;

  mkdirSync(join(outDir, "assets"), { recursive: true });
  mkdirSync(join(outDir, "elementor"), { recursive: true });

  writeFileSync(
    join(outDir, "style.css"),
    buildStyleCssHeader({ themeName, themeSlug, description, author }),
    "utf8",
  );
  writeFileSync(join(outDir, "functions.php"), buildFunctionsPhp(themeSlug), "utf8");
  writeFileSync(join(outDir, "assets", "tokens.css"), tokensCss, "utf8");
  writeFileSync(
    join(outDir, "elementor", "elementor-kit-manifest.json"),
    JSON.stringify(elementorManifest, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(
    join(outDir, "elementor", "APPLY.md"),
    buildApplyInstructions(),
    "utf8",
  );
}

function buildApplyInstructions() {
  return `# Apply Elementor kit settings

This folder was generated locally. Import or apply settings on your WordPress site:

## Option A — EMCP (connected site)

1. **System colors** — \`emcp-tools-replace-system-colors\` with \`system_colors\` from \`elementor-kit-manifest.json\`.
2. **Custom colors** — \`emcp-tools-update-global-colors\` with \`custom_colors\` (upsert only; remove stale IDs manually in Site Settings if needed).
3. **System typography** — \`emcp-tools-replace-system-typography\` with \`system_typography\` from the manifest. On some sites \`emcp-tools-update-global-typography\` only touches custom slots; do not rely on it for primary/secondary/text/accent.
4. **Custom typography** — \`emcp-tools-update-global-typography\` with \`custom_typography\` when the manifest includes entries.
5. **Buttons, forms, body, headings** — merge \`kit_settings\` via \`emcp-tools-update-page-settings\` on the active kit post (from \`emcp-tools-get-global-settings\`), or paste into Elementor Site Settings manually.
6. **CSS** — \`emcp-tools-regenerate-css\` with \`scope: "site"\`, \`confirm: true\` after globals change.

## Option B — Manual

Elementor → Site Settings → Global Colors / Global Fonts / Theme Style. Match values from \`elementor-kit-manifest.json\`.

## Option C — WP-CLI (if Elementor CLI available)

Merge \`kit_settings\` into the active kit post meta per your deployment workflow.
`;
}
