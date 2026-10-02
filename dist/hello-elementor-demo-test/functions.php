<?php
/**
 * hello-elementor-demo-test child theme bootstrap.
 *
 * @package hello-elementor-demo-test
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HELLO_ELEMENTOR_DEMO_TEST_VERSION', '1.0.0' );

/**
 * Enqueue parent and child styles (and token CSS).
 */
function hello_elementor_demo_test_enqueue_styles() {
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
		'hello-elementor-demo-test-tokens',
		get_stylesheet_directory_uri() . '/assets/tokens.css',
		array( $parent_handle ),
		HELLO_ELEMENTOR_DEMO_TEST_VERSION
	);

	wp_enqueue_style(
		'hello-elementor-demo-test-style',
		get_stylesheet_directory_uri() . '/style.css',
		array( 'hello-elementor-demo-test-tokens' ),
		HELLO_ELEMENTOR_DEMO_TEST_VERSION
	);
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_demo_test_enqueue_styles', 20 );

/**
 * Optional: enqueue Google Fonts referenced in tokens (filter to extend).
 *
 * @param string[] $font_families Font family names.
 */
function hello_elementor_demo_test_enqueue_fonts( $font_families ) {
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
		'hello-elementor-demo-test-fonts',
		'https://fonts.googleapis.com/css2?family=' . $query . '&display=swap',
		array(),
		null
	);
}

/**
 * Load fonts from elementor-kit-manifest.json when present.
 */
function hello_elementor_demo_test_maybe_enqueue_kit_fonts() {
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

	hello_elementor_demo_test_enqueue_fonts( array_unique( $families ) );
}
add_action( 'wp_enqueue_scripts', 'hello_elementor_demo_test_maybe_enqueue_kit_fonts', 15 );
