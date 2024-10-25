<?php
/**
 * Adds the default template part areas to the REST API index.
 *
 * This function exposes the default template part areas through the WordPress REST API.
 * Note: This function backports into the wp-includes/rest-api/class-wp-rest-server.php file.
 *
 * @param WP_REST_Response $response REST API response.
 * @return WP_REST_Response Modified REST API response with default template part areas.
 */
function gutenberg_add_default_template_part_areas_to_index( WP_REST_Response $response ) {
	$response->data['defaultTemplatePartAreas'] = get_allowed_block_template_part_areas();
	return $response;
}

add_action( 'rest_index', 'gutenberg_add_default_template_part_areas_to_index' );

/**
 * Adds the default template types to the REST API index.
 *
 * This function exposes the default template types through the WordPress REST API.
 * Note: This function backports into the wp-includes/rest-api/class-wp-rest-server.php file.
 *
 * @param WP_REST_Response $response REST API response.
 * @return WP_REST_Response Modified REST API response with default template part areas.
 */
function gutenberg_add_default_template_types_to_index( WP_REST_Response $response ) {
	$indexed_template_types = array();
	foreach ( get_default_block_template_types() as $slug => $template_type ) {
		$template_type['slug']    = (string) $slug;
		$indexed_template_types[] = $template_type;
	}

	$response->data['defaultTemplateTypes'] = $indexed_template_types;
	return $response;
}

add_action( 'rest_index', 'gutenberg_add_default_template_types_to_index' );
