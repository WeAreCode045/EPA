<?php
/**
 * hello-elementor-theoriemeesters child theme bootstrap.
 *
 * @package hello-elementor-theoriemeesters
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION', '1.0.4' );

/**
 * Enqueue parent and child styles (and token CSS).
 */
function hello_elementor_theoriemeesters_enqueue_styles() {
	$parent_handle = 'hello-elementor';
	$parent_theme  = wp_get_theme( 'hello-elementor' );
	$parent_ver    = $parent_theme->exists() ? $parent_theme->get( 'Version' ) : false;

	wp_enqueue_style(
		$parent_handle,
		get_template_directory_uri() . '/style.css',
		array(),
		$parent_ver
	);

	wp_enqueue_style(
		'hello-elementor-theoriemeesters-tokens',
		get_stylesheet_directory_uri() . '/assets/tokens.css',
		array( $parent_handle ),
		HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION
	);

	wp_enqueue_style(
		'hello-elementor-theoriemeesters-style',
		get_stylesheet_directory_uri() . '/style.css',
		array( 'hello-elementor-theoriemeesters-tokens' ),
		HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION
	);

	wp_enqueue_style(
		'hello-elementor-theoriemeesters-site',
		get_stylesheet_directory_uri() . '/assets/site.css',
		array( 'hello-elementor-theoriemeesters-tokens' ),
		HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_theoriemeesters_enqueue_styles', 20 );

/**
 * Design-system layout tokens (.site / .shell) for site.css.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function hello_elementor_theoriemeesters_body_classes( $classes ) {
	$classes[] = 'site';
	$classes[] = 'shell';

	if ( is_page( 318 ) ) {
		$filter = isset( $_GET['filter'] ) ? sanitize_key( wp_unslash( $_GET['filter'] ) ) : '';
		$classes[] = $filter !== '' ? 'tm-filter-' . $filter : 'tm-filter-all';
	}

	return $classes;
}
add_filter( 'body_class', 'hello_elementor_theoriemeesters_body_classes' );

/**
 * Optional: enqueue Google Fonts referenced in tokens (filter to extend).
 *
 * @param string[] $font_families Font family names.
 */
function hello_elementor_theoriemeesters_enqueue_fonts( $font_families ) {
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
		'hello-elementor-theoriemeesters-fonts',
		'https://fonts.googleapis.com/css2?family=' . $query . '&display=swap',
		array(),
		null
	);
}

/**
 * Load fonts from elementor-kit-manifest.json when present.
 */
function hello_elementor_theoriemeesters_maybe_enqueue_kit_fonts() {
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

	hello_elementor_theoriemeesters_enqueue_fonts( array_unique( $families ) );
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_theoriemeesters_maybe_enqueue_kit_fonts', 15 );

/**
 * Full design-system CSS on the front page (mockup parity for Elementor sections).
 */
function hello_elementor_theoriemeesters_enqueue_home_styles() {
	if ( ! is_front_page() ) {
		return;
	}
	$path = get_stylesheet_directory() . '/assets/site-home.css';
	if ( ! is_readable( $path ) ) {
		return;
	}
	wp_enqueue_style(
		'hello-elementor-theoriemeesters-site-home',
		get_stylesheet_directory_uri() . '/assets/site-home.css',
		array( 'hello-elementor-theoriemeesters-site' ),
		HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_theoriemeesters_enqueue_home_styles', 25 );

/**
 * Inner Elementor pages (shop, oefenen, cart, etc.).
 */
function hello_elementor_theoriemeesters_enqueue_page_styles() {
	if ( is_front_page() ) {
		return;
	}
	$path = get_stylesheet_directory() . '/assets/site-pages.css';
	if ( ! is_readable( $path ) ) {
		return;
	}
	wp_enqueue_style(
		'hello-elementor-theoriemeesters-site-pages',
		get_stylesheet_directory_uri() . '/assets/site-pages.css',
		array( 'hello-elementor-theoriemeesters-site' ),
		HELLO_ELEMENTOR_THEORIEMEESTERS_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_theoriemeesters_enqueue_page_styles', 25 );
