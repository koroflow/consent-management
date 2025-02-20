import type { ThemeValue } from '../theme';

/**
 * Configuration object for styling different parts of the CookieBanner component.
 * @public
 */
export type CookieBannerTheme = Partial<{
	/** @remarks Styles for the root container element */
	'cookie-banner.root': ThemeValue;
	/** @remarks Styles for the card element */
	'cookie-banner.card': ThemeValue;
	/** @remarks Styles for the main content wrapper */
	'cookie-banner.header.root': ThemeValue;
	/** @remarks Styles for the banner title */
	'cookie-banner.header.title': ThemeValue;
	/** @remarks Styles for the banner description text */
	'cookie-banner.header.description': ThemeValue;
	/** @remarks Styles for the footer container */
	'cookie-banner.footer': ThemeValue;
	/** @remarks Styles for the footer sub-group element */
	'cookie-banner.footer.sub-group': ThemeValue;
	/** @remarks Styles for the footer reject button element */
	'cookie-banner.footer.reject-button': ThemeValue;
	/** @remarks Styles for the footer customize button element */
	'cookie-banner.footer.customize-button': ThemeValue;
	/** @remarks Styles for the footer accept button element */
	'cookie-banner.footer.accept-button': ThemeValue;
	/** @remarks Styles for the overlay element */
	'cookie-banner.overlay': ThemeValue;
}>;
