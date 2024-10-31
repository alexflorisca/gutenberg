/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { globe, seen, check } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import GlobalStylesUI from '../global-styles/ui';
import Page from '../page';
import { unlock } from '../../lock-unlock';
import StyleBook from '../style-book';
import { STYLE_BOOK_COLOR_GROUPS } from '../style-book/constants';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const GLOBAL_STYLES_PATH_PREFIX = '/wp_global_styles';

const GlobalStylesPageActions = ( {
	isStyleBookOpened,
	setIsStyleBookOpened,
} ) => {
	return (
		<DropdownMenu
			icon={ isStyleBookOpened ? seen : globe }
			label={
				isStyleBookOpened
					? __( 'View site home template' )
					: __( 'View style book' )
			}
		>
			{ ( { onClose } ) => (
				<>
					<MenuGroup>
						<MenuItem
							icon={ isStyleBookOpened ? check : null }
							onClick={ () => {
								setIsStyleBookOpened( true );
								onClose();
							} }
							info={ __( 'Preview blocks and styles' ) }
						>
							{ __( 'Style book' ) }
						</MenuItem>
						<MenuItem
							icon={ isStyleBookOpened ? null : check }
							onClick={ () => {
								setIsStyleBookOpened( false );
								onClose();
							} }
							info={ __( 'Preview site home template' ) }
						>
							{ __( 'Site' ) }
						</MenuItem>
					</MenuGroup>
				</>
			) }
		</DropdownMenu>
	);
};

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
					! isMobileViewport ? (
						<GlobalStylesPageActions
							isStyleBookOpened={ isStyleBookOpened }
							setIsStyleBookOpened={ setIsStyleBookOpened }
						/>
					) : null
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
