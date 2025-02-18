// Re-export store
export { createConsentManagerStore } from './store';
export type { PrivacyConsentState } from './store.type';
// Re-export all utilities
export * from './libs/consent-utils';
export { createTrackingBlocker } from './libs/tracking-blocker';
export type { TrackingBlockerConfig } from './libs/tracking-blocker';

// Re-export types and constants
export { consentTypes } from './types';
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
	NamespaceProps,
	TranslationConfig,
	Translations,
	CookieBannerTranslations,
	ConsentManagerDialogTranslations,
	ConsentManagerWidgetTranslations,
	ConsentTypeTranslations,
	ConsentTypesTranslations,
} from './types';

export { defaultTranslationConfig } from './translations';
