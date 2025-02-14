import { type Ref, forwardRef } from 'react';
import { ConsentButton } from '../../primitives/button';
import type { ConsentButtonProps } from '../../primitives/button.types';

/**
 * Button to accept all available cookies.
 *
 * @remarks
 * - Enables all consent options
 * - Closes dialog after action
 * - Triggers necessary callbacks
 */
const ConsentManagerWidgetAcceptAllButton = forwardRef<
	HTMLButtonElement,
	ConsentButtonProps
>(({ children, ...props }, ref) => {
	return (
		<ConsentButton
			ref={ref as Ref<HTMLButtonElement>}
			variant="neutral"
			mode="stroke"
			size="small"
			action="accept-consent"
			{...props}
			themeKey="consent-manager-widget.footer.accept-button"
			data-testid="consent-manager-widget-footer-accept-button"
			closeCookieBanner={true}
			closeCustomizeDialog={true}
		>
			{children}
		</ConsentButton>
	);
});

const ConsentManagerWidgetCustomizeButton = forwardRef<
	HTMLButtonElement,
	ConsentButtonProps
>(({ children, ...props }, ref) => {
	return (
		<ConsentButton
			ref={ref as Ref<HTMLButtonElement>}
			action="open-consent-dialog"
			{...props}
			themeKey="consent-manager-widget.footer.customize-button"
			data-testid="consent-manager-widget-footer-customize-button"
		>
			{children}
		</ConsentButton>
	);
});

const ConsentManagerWidgetSaveButton = forwardRef<
	HTMLButtonElement,
	ConsentButtonProps
>(({ children, ...props }, ref) => {
	return (
		<ConsentButton
			ref={ref as Ref<HTMLButtonElement>}
			action="custom-consent"
			variant="primary"
			closeCustomizeDialog
			{...props}
			themeKey="consent-manager-widget.footer.save-button"
			data-testid="consent-manager-widget-footer-save-button"
		>
			{children}
		</ConsentButton>
	);
});

const AcceptAllButton = ConsentManagerWidgetAcceptAllButton;
const CustomizeButton = ConsentManagerWidgetCustomizeButton;
const SaveButton = ConsentManagerWidgetSaveButton;

export {
	AcceptAllButton,
	CustomizeButton,
	SaveButton,
	ConsentManagerWidgetAcceptAllButton,
	ConsentManagerWidgetCustomizeButton,
	ConsentManagerWidgetSaveButton,
};
