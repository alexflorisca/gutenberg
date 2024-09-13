/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockPopoverInbetween from '../block-popover/inbetween';
import ZoomOutModeInserterButton from './zoom-out-mode-inserter-button';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

function ZoomOutModeInserters() {
	const [ isReady, setIsReady ] = useState( false );
	const {
		hasSelection,
		blockInsertionPoint,
		blockOrder,
		blockInsertionPointVisible,
		setInserterIsOpened,
		sectionRootClientId,
		selectedBlockClientId,
		hoveredBlockClientId,
	} = useSelect( ( select ) => {
		const {
			getSettings,
			getInsertionCue,
			getBlockOrder,
			getSelectionStart,
			getSelectedBlockClientId,
			getHoveredBlockClientId,
			isBlockInsertionPointVisible,
			getSectionRootClientId,
		} = unlock( select( blockEditorStore ) );

		const root = getSectionRootClientId();

		return {
			hasSelection: !! getSelectionStart().clientId,
			blockInsertionPoint: getInsertionCue(),
			blockOrder: getBlockOrder( root ),
			blockInsertionPointVisible: isBlockInsertionPointVisible(),
			sectionRootClientId: root,
			setInserterIsOpened:
				getSettings().__experimentalSetIsInserterOpened,
			selectedBlockClientId: getSelectedBlockClientId(),
			hoveredBlockClientId: getHoveredBlockClientId(),
		};
	}, [] );

	const { showInsertionPoint } = useDispatch( blockEditorStore );

	// Defer the initial rendering to avoid the jumps due to the animation.
	useEffect( () => {
		const timeout = setTimeout( () => {
			setIsReady( true );
		}, 500 );
		return () => {
			clearTimeout( timeout );
		};
	}, [] );

	if ( ! isReady ) {
		return null;
	}

	return [ undefined, ...blockOrder ].map( ( clientId, index ) => {
		const shouldRenderInsertionPoint =
			blockInsertionPointVisible && blockInsertionPoint.index === index;

		const previousClientId = clientId;
		const nextClientId = blockOrder[ index ];

		const isSelected =
			hasSelection &&
			( selectedBlockClientId === previousClientId ||
				selectedBlockClientId === nextClientId );

		const isHovered =
			hoveredBlockClientId === previousClientId ||
			hoveredBlockClientId === nextClientId;

		return (
			<BlockPopoverInbetween
				key={ index }
				previousClientId={ previousClientId }
				nextClientId={ nextClientId }
			>
				{ ! shouldRenderInsertionPoint && (
					<ZoomOutModeInserterButton
						isVisible={ isSelected || isHovered }
						onClick={ () => {
							setInserterIsOpened( {
								rootClientId: sectionRootClientId,
								insertionIndex: index,
								tab: 'patterns',
								category: 'all',
							} );
							showInsertionPoint( sectionRootClientId, index, {
								operation: 'insert',
							} );
						} }
					/>
				) }
			</BlockPopoverInbetween>
		);
	} );
}

export default ZoomOutModeInserters;
