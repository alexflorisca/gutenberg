/**
 * Internal dependencies
 */
import {
	GridView,
	GridLineX,
	GridLineY,
} from './styles/focal-point-picker-style';
import type { FocalPointPickerGridProps } from './types';
import type { WordPressPolymorphicComponentProps } from '../context/wordpress-component';

export default function FocalPointPickerGrid( {
	bounds,
	...props
}: WordPressPolymorphicComponentProps< FocalPointPickerGridProps, 'div' > ) {
	return (
		<GridView
			{ ...props }
			className="components-focal-point-picker__grid"
			style={ {
				width: bounds.width,
				height: bounds.height,
			} }
		>
			<GridLineX style={ { top: '33%' } } />
			<GridLineX style={ { top: '66%' } } />
			<GridLineY style={ { left: '33%' } } />
			<GridLineY style={ { left: '66%' } } />
		</GridView>
	);
}
