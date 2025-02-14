import type { ThemeValue } from '../theme';
/**
 * Configuration object for styling different parts of the ConsentManagerWidget component.
 * @public
 */
export type ConsentManagerWidgetTheme = Partial<{
	/** @remarks Styles for the root container element */
	'consent-manager-widget.root': ThemeValue;
	/** @remarks Styles for the branding element */
	'consent-manager-widget.branding': ThemeValue;
	/** @remarks Styles for the footer element */
	'consent-manager-widget.footer': ThemeValue;
	/** @remarks Styles for the footer sub-group element */
	'consent-manager-widget.footer.sub-group': ThemeValue;
	/** @remarks Styles for the footer reject button element */
	'consent-manager-widget.footer.reject-button': ThemeValue;
	/** @remarks Styles for the footer accept button element */
	'consent-manager-widget.footer.accept-button': ThemeValue;
	/** @remarks Styles for the footer customize button element */
	'consent-manager-widget.footer.customize-button': ThemeValue;
	/** @remarks Styles for the footer save button element */
	'consent-manager-widget.footer.save-button': ThemeValue;
	/** @remarks Styles for the accordion element */
	'consent-manager-widget.accordion': ThemeValue;
	/** @remarks Styles for the accordion trigger element */
	'consent-manager-widget.accordion.trigger': ThemeValue;
	/** @remarks Styles for the accordion trigger inner element */
	'consent-manager-widget.accordion.trigger-inner': ThemeValue;
	/** @remarks Styles for the accordion item element */
	'consent-manager-widget.accordion.item': ThemeValue;
	/** @remarks Styles for the accordion icon element */
	'consent-manager-widget.accordion.icon': ThemeValue;
	/** @remarks Styles for the accordion arrow open element */
	'consent-manager-widget.accordion.arrow.open': ThemeValue;
	/** @remarks Styles for the accordion arrow close element */
	'consent-manager-widget.accordion.arrow.close': ThemeValue;
	/** @remarks Styles for the accordion content element */
	'consent-manager-widget.accordion.content': ThemeValue;
	/** @remarks Styles for the accordion content inner element */
	'consent-manager-widget.accordion.content-inner': ThemeValue;
	/** @remarks Styles for the switch element */
	'consent-manager-widget.switch': ThemeValue;
	/** @remarks Styles for the switch track element */
	'consent-manager-widget.switch.track': ThemeValue;
	/** @remarks Styles for the switch thumb element */
	'consent-manager-widget.switch.thumb': ThemeValue;
}>;
