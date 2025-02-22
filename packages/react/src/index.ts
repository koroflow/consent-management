// CookieBanner
export { CookieBanner } from './components/cookie-banner/cookie-banner';
export type { CookieBannerProps } from './components/cookie-banner/cookie-banner';
export type { CookieBannerTheme } from './components/cookie-banner/theme';

// ConsentManagerDialog
export { ConsentManagerDialog } from './components/consent-manager-dialog/consent-manager-dialog';
export type { ConsentManagerDialogProps } from './components/consent-manager-dialog/consent-manager-dialog';
export type { ConsentManagerDialogTheme } from './components/consent-manager-dialog/theme';

// ConsentManagerWidget
export { ConsentManagerWidget } from './components/consent-manager-widget/consent-manager-widget';
export type { ConsentManagerWidgetProps } from './components/consent-manager-widget/types';
export type { ConsentManagerWidgetTheme } from './components/consent-manager-widget/theme';

// Hooks
export * from '~/hooks';

// Providers
export { ConsentManagerProvider } from './providers/consent-manager-provider';

// Types
export type { ThemeValue, ClassNameStyle } from './types/theme';
export type { ConsentManagerProviderProps } from './types/consent-manager';

// Re-export types and constants
export { consentTypes } from 'c15t';
export type {
	CallbackFunction,
	Callbacks,
	AllConsentNames,
	ConsentType,
	ConsentState,
	ComplianceRegion,
	ComplianceSettings,
	PrivacySettings,
	HasConsentedProps,
} from 'c15t';
