export { ConsentManagerProvider } from './components/consent-manager-provider';
export { useConsentManager } from './hooks/use-consent-manager';
export type { ConsentManagerProviderProps } from './types/consent-manager';
export { useTranslations } from './store/use-translations';

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
