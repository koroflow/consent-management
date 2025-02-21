export type ButtonCSSVariables = {
	/* Primary Colors */
	'--button-primary': string;
	'--button-primary-dark': string;
	'--button-primary-hover': string;
	'--button-primary-hover-dark': string;

	/* Neutral Colors */
	'--button-neutral': string;
	'--button-neutral-dark': string;
	'--button-neutral-hover': string;
	'--button-neutral-hover-dark': string;
	'--button-neutral-soft': string;
	'--button-neutral-soft-dark': string;

	/* Theme Colors */
	'--button-text': string;
	'--button-text-dark': string;
	'--button-bg': string;
	'--button-bg-dark': string;
	'--button-border': string;
	'--button-border-dark': string;
	'--button-hover-overlay': string;
	'--button-hover-overlay-dark': string;

	/* Component Variables */
	'--button-font': string;
	'--button-border-width': string;
	'--button-border-style': string;
	'--button-border-color': string;
	'--button-border-radius': string;
	'--button-font-weight': string | number;
	'--button-font-size': string;
	'--button-line-height': string;
	'--button-transition': string;
	'--button-cursor': string;

	/* Shadows */
	'--button-shadow': string;
	'--button-shadow-dark': string;
	'--button-shadow-primary-focus': string;
	'--button-shadow-neutral-focus': string;
	'--button-shadow-primary': string;
	'--button-shadow-primary-dark': string;
	'--button-shadow-primary-hover': string;
	'--button-shadow-primary-hover-dark': string;
	'--button-shadow-neutral': string;
	'--button-shadow-neutral-dark': string;
	'--button-shadow-neutral-hover': string;
	'--button-shadow-neutral-hover-dark': string;
};

/**
 * Default values for button CSS variables as defined in button.module.css
 */
export const defaultButtonCSSVariables: ButtonCSSVariables = {
	/* Primary Colors */
	'--button-primary': 'hsl(227.94, 100%, 60%)',
	'--button-primary-dark': 'hsl(228.07, 69.8%, 48.04%)',
	'--button-primary-hover': 'hsl(227.93, 100%, 63.92%, 10%)',
	'--button-primary-hover-dark': 'hsl(228.07, 69.8%, 43.04%)',

	/* Neutral Colors */
	'--button-neutral': 'hsl(0, 0%, 36%)',
	'--button-neutral-dark': 'hsl(220, 15%, 30%)',
	'--button-neutral-hover': 'hsl(220, 15%, 45%)',
	'--button-neutral-hover-dark': 'hsl(220, 15%, 25%)',
	'--button-neutral-soft': 'hsl(0, 0%, 92.16%)',
	'--button-neutral-soft-dark': 'hsl(220, 15%, 30%)',

	/* Theme Colors */
	'--button-text': 'hsla(0, 0%, 36%, 1)',
	'--button-text-dark': 'hsla(220, 15%, 90%, 1)',
	'--button-bg': 'hsla(0, 0%, 100%, 1)',
	'--button-bg-dark': 'hsla(0, 0%, 15%, 1)',
	'--button-border': 'hsla(0, 0%, 36%, 1)',
	'--button-border-dark': 'hsla(220, 15%, 30%, 1)',
	'--button-hover-overlay': 'hsla(220, 15%, 20%, 0.05)',
	'--button-hover-overlay-dark': 'hsla(220, 15%, 90%, 0.1)',

	/* Component Variables */
	'--button-font': 'inherit',
	'--button-border-width': '0px',
	'--button-border-style': 'solid',
	'--button-border-color': 'transparent',
	'--button-border-radius': '0.375rem',
	'--button-font-weight': '500',
	'--button-font-size': '0.875rem',
	'--button-line-height': '1.25rem',
	'--button-transition': 'all 150ms ease-in-out',
	'--button-cursor': 'pointer',

	/* Shadows */
	'--button-shadow': '0px 1px 2px 0px hsla(222, 32%, 8%, 0.06)',
	'--button-shadow-dark': '0px 1px 2px 0px hsla(0, 0%, 20%, 1)',
	'--button-shadow-primary-focus':
		'0 0 0 4px hsla(227.93, 100%, 63.92%, 20%)',
	'--button-shadow-neutral-focus': '0 0 0 4px hsla(0, 0%, 9.02%, 20%)',
	'--button-shadow-primary':
		'var(--button-shadow), inset 0 0 0 1px var(--button-primary)',
	'--button-shadow-primary-dark':
		'var(--button-shadow-dark), inset 0 0 0 1px var(--button-primary-dark)',
	'--button-shadow-primary-hover': 'none',
	'--button-shadow-primary-hover-dark': 'none',
	'--button-shadow-neutral':
		'var(--button-shadow), inset 0 0 0 1px var(--button-neutral-soft)',
	'--button-shadow-neutral-dark':
		'var(--button-shadow-dark), inset 0 0 0 1px var(--button-neutral-soft-dark)',
	'--button-shadow-neutral-hover': 'none',
	'--button-shadow-neutral-hover-dark': 'none',
};
