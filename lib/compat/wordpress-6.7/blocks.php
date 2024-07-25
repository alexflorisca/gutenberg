<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Allow passing a PHP file as `variations` field for Core versions < 6.7
 *
 * @param array $settings Array of determined settings for registering a block type.
 * @param array $metadata Metadata provided for registering a block type.
 * @return array The block type settings
 */
function gutenberg_filter_block_type_metadata_settings_allow_variations_php_file( $settings, $metadata ) {
	// If `variations` is a string, it's the name of a PHP file that
	// generates the variations.
	if ( ! empty( $settings['variations'] ) && is_string( $settings['variations'] ) ) {
		$variations_path = wp_normalize_path(
			realpath(
				dirname( $metadata['file'] ) . '/' .
				remove_block_asset_path_prefix( $settings['variations'] )
			)
		);
		if ( $variations_path ) {
			/**
			 * Generates the list of block variations.
			 *
			 * @since 6.7.0
			 *
			 * @return string Returns the list of block variations.
			 */
			$settings['variation_callback'] = static function () use ( $variations_path ) {
				$variations = require $variations_path;
				return $variations;
			};
			// The block instance's `variations` field is only allowed to be an array
			// (of known block variations). We unset it so that the block instance will
			// provide a getter that returns the result of the `variation_callback` instead.
			unset( $settings['variations'] );
		}
	}
	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_filter_block_type_metadata_settings_allow_variations_php_file', 10, 2 );

/**
 * Adds post format query vars to the query loop block's WP_Query when the block's attributes call for them.
 *
 * @see 'query_loop_block_query_vars'
 *
 * @param array    $query The query vars.
 * @param WP_Block $block Block instance.
 * @return array   The filtered query vars.
 */
function gutenberg_add_format_query_vars_to_query_loop_block( $query, $block ) {
	// Return early if there is no format or if the format is not an array.
	if ( empty( $block->context['query']['format'] ) || ! is_array( $block->context['query']['format'] ) ) {
		return $query;
	}

	$formats = $block->context['query']['format'];
	/*
	 * Validate that the format is either `standard` or a supported post format.
	 * - First, add `standard` to the array of valid formats.
	 * - Then, remove any invalid formats.
	 */
	$valid_formats = array_merge( array( 'standard' ), get_post_format_slugs() );
	$formats       = array_intersect( $formats, $valid_formats );

	/*
	 * The relation needs to be set to `OR` since the request can contain
	 * two separate conditions. The user may be querying for items that have
	 * either the `standard` format or a specific format.
	 */
	$formats_query = array( 'relation' => 'OR' );

	/*
	 * The default post format, `standard`, is not stored in the database.
	 * If `standard` is part of the request, the query needs to exclude all post items that
	 * have a format assigned.
	 */
	if ( in_array( 'standard', $formats, true ) ) {
		$formats_query[] = array(
			'taxonomy' => 'post_format',
			'field'    => 'slug',
			'operator' => 'NOT EXISTS',
		);
		// Remove the `standard` format, since it cannot be queried.
		unset( $formats[ array_search( 'standard', $formats, true ) ] );
	}
	// Add any remaining formats to the formats query.
	if ( ! empty( $formats ) ) {
		// Add the `post-format-` prefix.
		$terms           = array_map(
			static function ( $format ) {
				return "post-format-$format";
			},
			$formats
		);
		$formats_query[] = array(
			'taxonomy' => 'post_format',
			'field'    => 'slug',
			'terms'    => $terms,
			'operator' => 'IN',
		);
	}

	/*
	 * Add `$formats_query` to `$query`, as long as it contains more than one key:
	 * If `$formats_query` only contains the initial `relation` key, there are no valid formats to query,
	 * and the query should not be modified.
	 */
	if ( count( $formats_query ) > 1 ) {
		// Enable filtering by both post formats and other taxonomies by combining them with `AND`.
		if ( empty( $query['tax_query'] ) ) {
			$query['tax_query'] = $formats_query;
		} else {
			$query['tax_query'] = array(
				'relation' => 'AND',
				$query['tax_query'],
				$formats_query,
			);
		}
	}

	return $query;
}
add_filter( 'query_loop_block_query_vars', 'gutenberg_add_format_query_vars_to_query_loop_block', 10, 2 );

/**
 * Filters the block type arguments during registration to stabilize experimental block supports.
 *
 * This is a temporary compatibility shim as the approach in core is for this to be handled
 * within the WP_Block_Type class rather than requiring a filter.
 *
 * @param array $args Array of arguments for registering a block type.
 * @return array Array of arguments for registering a block type.
 */
function gutenberg_stabilize_experimental_block_supports( $args ) {
	if ( empty( $args['supports']['typography'] ) ) {
		return $args;
	}

	$experimental_typography_supports_to_stable = array(
		'__experimentalFontFamily'     => 'fontFamily',
		'__experimentalFontStyle'      => 'fontStyle',
		'__experimentalFontWeight'     => 'fontWeight',
		'__experimentalLetterSpacing'  => 'letterSpacing',
		'__experimentalTextDecoration' => 'textDecoration',
		'__experimentalTextTransform'  => 'textTransform',
	);

	$current_typography_supports = $args['supports']['typography'];
	$stable_typography_supports  = array();

	foreach ( $current_typography_supports as $key => $value ) {
		if ( array_key_exists( $key, $experimental_typography_supports_to_stable ) ) {
			$stable_typography_supports[ $experimental_typography_supports_to_stable[ $key ] ] = $value;
		} else {
			$stable_typography_supports[ $key ] = $value;
		}
	}

	$args['supports']['typography'] = $stable_typography_supports;

	return $args;
}

add_filter( 'register_block_type_args', 'gutenberg_stabilize_experimental_block_supports', PHP_INT_MAX, 1 );
