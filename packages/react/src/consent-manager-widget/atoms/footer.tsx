import { type Ref, forwardRef } from 'react';
import { Box, type BoxProps } from '../../primitives/box';
import { ConsentButton } from '../../primitives/button';
import type { ConsentButtonProps } from '../../primitives/button.types';

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

/**
 * Button to reject all non-essential cookies.
 *
 * @remarks
 * - Sets all optional consents to false
 * - Maintains required consents
 * - Closes dialog after action
 */
export const ConsentManagerWidgetRejectButton = forwardRef<
	HTMLButtonElement,
	ConsentButtonProps
>(({ children, ...props }, ref) => {
	return (
		<ConsentButton
			ref={ref as Ref<HTMLButtonElement>}
			variant="neutral"
			mode="stroke"
			size="small"
			action="reject-consent"
			{...props}
			themeKey="consent-manager-widget.footer.reject-button"
			data-testid="consent-manager-widget-reject-button"
			closeCookieBanner={true}
			closeCustomizeDialog={true}
		>
			{children}
		</ConsentButton>
	);
});
