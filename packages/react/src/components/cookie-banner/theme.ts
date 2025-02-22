import type { ButtonCSSVariables } from '~/components/shared/ui/button';
import type { ThemeValue } from '~/types/theme';

/**
 * Configuration object for styling different parts of the CookieBanner component.
 * @public
 */
export type CookieBannerTheme = Partial<{
	/** @remarks Styles for the root container element */
	'banner.root': ThemeValue<RootCSSVariables>;
	/** @remarks Styles for the card element */
	'banner.card': ThemeValue<CardCSSVariables>;
	/** @remarks Styles for the main content wrapper */
	'banner.header.root': ThemeValue<HeaderCSSVariables>;
	/** @remarks Styles for the banner title */
	'banner.header.title': ThemeValue<TitleCSSVariables>;
	/** @remarks Styles for the banner description text */
	'banner.header.description': ThemeValue<DescriptionCSSVariables>;
	/** @remarks Styles for the footer container */
	'banner.footer': ThemeValue<FooterCSSVariables>;
	/** @remarks Styles for the footer sub-group element */
	'banner.footer.sub-group': ThemeValue;
	/** @remarks Styles for the footer reject button element */
	'banner.footer.reject-button': ThemeValue<ButtonCSSVariables>;
	/** @remarks Styles for the footer customize button element */
	'banner.footer.customize-button': ThemeValue<ButtonCSSVariables>;
	/** @remarks Styles for the footer accept button element */
	'banner.footer.accept-button': ThemeValue<ButtonCSSVariables>;
	/** @remarks Styles for the overlay element */
	'banner.overlay': ThemeValue<OverlayCSSVariables>;
}>;

/** Root component CSS variables */
type RootCSSVariables = {
	'--border-radius-sm': string;
	'--border-radius': string;
	'--max-width': string;
	'--entry-animation': string;
	'--exit-animation': string;
};

/** Card component CSS variables */
type CardCSSVariables = {
	'--border-width': string;
	'--border-color': string;
	'--border-color-dark': string;
	'--background-color': string;
	'--background-color-dark': string;
	'--shadow': string;
};

/** Header component CSS variables */
type HeaderCSSVariables = {
	'--text-color': string;
};

/** Title component CSS variables */
type TitleCSSVariables = {
	'--title-color': string;
	'--title-color-dark': string;
};

/** Description component CSS variables */
type DescriptionCSSVariables = {
	'--description-color': string;
	'--description-color-dark': string;
};

/** Footer component CSS variables */
type FooterCSSVariables = {
	'--footer-background-color': string;
	'--footer-background-color-dark': string;
};

/** Overlay component CSS variables */
type OverlayCSSVariables = {
	'--overlay-background-color': string;
	'--overlay-background-color-dark': string;
};
