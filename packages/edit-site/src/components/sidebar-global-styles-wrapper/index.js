/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { layout, seen } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles/ui';
import Page from '../page';
import { unlock } from '../../lock-unlock';
import SidebarButton from '../sidebar-button';
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const GLOBAL_STYLES_PATH_PREFIX = '/wp_global_styles';

export default function GlobalStylesUIWrapper() {
	const { params } = useLocation();
	const history = useHistory();
	const { canvas = 'view' } = params;
	const [ isStyleBookOpened, setIsStyleBookOpened ] = useState( true );
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const pathWithPrefix = params.path;
	const [ path, onPathChange ] = useMemo( () => {
		const processedPath = pathWithPrefix.substring(
			GLOBAL_STYLES_PATH_PREFIX.length
		);
		return [
			processedPath ? processedPath : '/',
			( newPath ) => {
				history.push( {
					path:
						! newPath || newPath === '/'
							? GLOBAL_STYLES_PATH_PREFIX
							: `${ GLOBAL_STYLES_PATH_PREFIX }${ newPath }`,
				} );
			},
		];
	}, [ pathWithPrefix, history ] );
	return (
		<>
			<Page
				actions={
					<>
						{ ! isMobileViewport && (
							<SidebarButton
								icon={ isStyleBookOpened ? layout : seen }
								label={
									isStyleBookOpened
										? __( 'View home template' )
										: __( 'View style book' )
								}
								onClick={ () =>
									setIsStyleBookOpened( ! isStyleBookOpened )
								}
							/>
						) }
					</>
				}
				className="edit-site-styles"
				title={ __( 'Styles' ) }
			>
				<GlobalStylesUI path={ path } onPathChange={ onPathChange } />
			</Page>
			{ canvas === 'view' && isStyleBookOpened && (
				<StyleBook
					enableResizing={ false }
					showCloseButton={ false }
					showTabs={ false }
					isSelected={ ( blockName ) =>
						// Match '/blocks/core%2Fbutton' and
						// '/blocks/core%2Fbutton/typography', but not
						// '/blocks/core%2Fbuttons'.
						path ===
							`/wp_global_styles/blocks/${ encodeURIComponent(
								blockName
							) }` ||
						path.startsWith(
							`/wp_global_styles/blocks/${ encodeURIComponent(
								blockName
							) }/`
						)
					}
					path={ path }
					onSelect={ ( blockName ) => {
						if (
							STYLE_BOOK_COLOR_GROUPS.find(
								( group ) => group.slug === blockName
							)
						) {
							// Go to color palettes Global Styles.
							onPathChange( '/colors/palette' );
							return;
						}

						// Now go to the selected block.
						onPathChange(
							`/blocks/${ encodeURIComponent( blockName ) }`
						);
					} }
				/>
			) }
		</>
	);
}
