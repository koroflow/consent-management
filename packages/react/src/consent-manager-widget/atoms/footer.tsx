import { type Ref, forwardRef } from 'react';
import { Box, type BoxProps } from '../../primitives/box';

/**
 * Footer component for consent management actions.
 *
 * @remarks
 * - Contains primary action buttons
 * - Supports customization through theme
 * - Maintains consistent layout
 */
export const ConsentManagerWidgetFooter = forwardRef<
	HTMLDivElement,
	Omit<BoxProps, 'themeKey'>
>(({ children, ...props }, ref) => {
	return (
		<Box
			ref={ref as Ref<HTMLDivElement>}
			baseClassName="c15t-consent-manager-widget-footer"
			data-testid="consent-manager-widget-footer"
			{...props}
			themeKey="consent-manager-widget.footer"
		>
			{children}
		</Box>
	);
});

export const ConsentManagerWidgetFooterSubGroup = forwardRef<
	HTMLDivElement,
	BoxProps
>(({ children, ...props }, ref) => {
	return (
		<Box
			ref={ref as Ref<HTMLDivElement>}
			baseClassName="c15t-consent-manager-widget-footer-sub-group"
			data-testid="consent-manager-widget-footer-sub-group"
			{...props}
			themeKey="consent-manager-widget.footer.sub-group"
		>
			{children}
		</Box>
	);
});

const Footer = ConsentManagerWidgetFooter;
const FooterSubGroup = ConsentManagerWidgetFooterSubGroup;

export { Footer, FooterSubGroup };
