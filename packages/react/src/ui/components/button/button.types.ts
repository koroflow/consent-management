export type ButtonCSSVariables = {
	/* Primary Colors */
	'--c15t-button-primary': string;
	'--c15t-button-primary-dark': string;
	'--c15t-button-primary-hover': string;
	'--c15t-button-primary-hover-dark': string;

	/* Neutral Colors */
	'--c15t-button-neutral': string;
	'--c15t-button-neutral-dark': string;
	'--c15t-button-neutral-hover': string;
	'--c15t-button-neutral-hover-dark': string;
	'--c15t-button-neutral-soft': string;
	'--c15t-button-neutral-soft-dark': string;

	/* Theme Colors */
	'--c15t-button-text': string;
	'--c15t-button-text-dark': string;
	'--c15t-button-bg': string;
	'--c15t-button-bg-dark': string;
	'--c15t-button-border': string;
	'--c15t-button-border-dark': string;
	'--c15t-button-hover-overlay': string;
	'--c15t-button-hover-overlay-dark': string;

	/* Component Variables */
	'--c15t-button-font': string;
	'--c15t-button-border-width': string;
	'--c15t-button-border-style': string;
	'--c15t-button-border-color': string;
	'--c15t-button-border-radius': string;
	'--c15t-button-font-weight': string | number;
	'--c15t-button-font-size': string;
	'--c15t-button-line-height': string;
	'--c15t-button-transition': string;
	'--c15t-button-cursor': string;

	/* Shadows */
	'--c15t-button-shadow': string;
	'--c15t-button-shadow-dark': string;
	'--c15t-button-shadow-primary-focus': string;
	'--c15t-button-shadow-neutral-focus': string;
	'--c15t-button-shadow-primary': string;
	'--c15t-button-shadow-primary-dark': string;
	'--c15t-button-shadow-primary-hover': string;
	'--c15t-button-shadow-primary-hover-dark': string;
	'--c15t-button-shadow-neutral': string;
	'--c15t-button-shadow-neutral-dark': string;
	'--c15t-button-shadow-neutral-hover': string;
	'--c15t-button-shadow-neutral-hover-dark': string;
};

/**
 * Default values for button CSS variables as defined in button.module.css
 */
export const defaultButtonCSSVariables: ButtonCSSVariables = {
	/* Primary Colors */
	'--c15t-button-primary': 'hsl(227.94, 100%, 60%)',
	'--c15t-button-primary-dark': 'hsl(228.07, 69.8%, 48.04%)',
	'--c15t-button-primary-hover': 'hsl(227.93, 100%, 63.92%, 10%)',
	'--c15t-button-primary-hover-dark': 'hsl(228.07, 69.8%, 43.04%)',

	/* Neutral Colors */
	'--c15t-button-neutral': 'hsl(0, 0%, 36%)',
	'--c15t-button-neutral-dark': 'hsl(220, 15%, 30%)',
	'--c15t-button-neutral-hover': 'hsl(220, 15%, 45%)',
	'--c15t-button-neutral-hover-dark': 'hsl(220, 15%, 25%)',
	'--c15t-button-neutral-soft': 'hsl(0, 0%, 92.16%)',
	'--c15t-button-neutral-soft-dark': 'hsl(220, 15%, 30%)',

	/* Theme Colors */
	'--c15t-button-text': 'hsla(0, 0%, 36%, 1)',
	'--c15t-button-text-dark': 'hsla(220, 15%, 90%, 1)',
	'--c15t-button-bg': 'hsla(0, 0%, 100%, 1)',
	'--c15t-button-bg-dark': 'hsla(0, 0%, 15%, 1)',
	'--c15t-button-border': 'hsla(0, 0%, 36%, 1)',
	'--c15t-button-border-dark': 'hsla(220, 15%, 30%, 1)',
	'--c15t-button-hover-overlay': 'hsla(220, 15%, 20%, 0.05)',
	'--c15t-button-hover-overlay-dark': 'hsla(220, 15%, 90%, 0.1)',

	/* Component Variables */
	'--c15t-button-font': 'inherit',
	'--c15t-button-border-width': '0px',
	'--c15t-button-border-style': 'solid',
	'--c15t-button-border-color': 'transparent',
	'--c15t-button-border-radius': '0.375rem',
	'--c15t-button-font-weight': '500',
	'--c15t-button-font-size': '0.875rem',
	'--c15t-button-line-height': '1.25rem',
	'--c15t-button-transition': 'all 150ms ease-in-out',
	'--c15t-button-cursor': 'pointer',

	/* Shadows */
	'--c15t-button-shadow': '0px 1px 2px 0px hsla(222, 32%, 8%, 0.06)',
	'--c15t-button-shadow-dark': '0px 1px 2px 0px hsla(0, 0%, 20%, 1)',
	'--c15t-button-shadow-primary-focus':
		'0 0 0 4px hsla(227.93, 100%, 63.92%, 20%)',
	'--c15t-button-shadow-neutral-focus': '0 0 0 4px hsla(0, 0%, 9.02%, 20%)',
	'--c15t-button-shadow-primary':
		'var(--c15t-button-shadow), inset 0 0 0 1px var(--c15t-button-primary)',
	'--c15t-button-shadow-primary-dark':
		'var(--c15t-button-shadow-dark), inset 0 0 0 1px var(--c15t-button-primary-dark)',
	'--c15t-button-shadow-primary-hover': 'none',
	'--c15t-button-shadow-primary-hover-dark': 'none',
	'--c15t-button-shadow-neutral':
		'var(--c15t-button-shadow), inset 0 0 0 1px var(--c15t-button-neutral-soft)',
	'--c15t-button-shadow-neutral-dark':
		'var(--c15t-button-shadow-dark), inset 0 0 0 1px var(--c15t-button-neutral-soft-dark)',
	'--c15t-button-shadow-neutral-hover': 'none',
	'--c15t-button-shadow-neutral-hover-dark': 'none',
};
