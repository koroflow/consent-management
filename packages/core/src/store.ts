/**
 * @packageDocumentation
 * Implements the core consent management store using Zustand.
 * This module provides the main store creation and management functionality.
 */

import { createStore } from 'zustand/vanilla';
import {
	getEffectiveConsents,
	hasConsentFor,
	hasConsented,
} from './libs/consent-utils';
import { createTrackingBlocker } from './libs/tracking-blocker';
import type { TrackingBlockerConfig } from './libs/tracking-blocker';
import { initialState } from './store.initial-state';
import type { PrivacyConsentState } from './store.type';
import {
	type ConsentState,
	type TranslationConfig,
	consentTypes,
} from './types';

/** Storage key for persisting consent data in localStorage */
const STORAGE_KEY = 'privacy-consent-storage';

/**
 * Structure of consent data stored in localStorage.
 *
 * @internal
 */
interface StoredConsent {
	/** Current consent states */
	consents: ConsentState;

	/** Metadata about when and how consent was given */
	consentInfo: {
		time: number;
		type: string;
	} | null;
}

/**
 * Retrieves stored consent data from localStorage.
 *
 * @remarks
 * This function handles:
 * - Checking for browser environment
 * - Parsing stored JSON data
 * - Error handling for invalid data
 *
 * @returns The stored consent data or null if not available
 * @internal
 */
const getStoredConsent = (): StoredConsent | null => {
	if (typeof window === 'undefined') return null;

	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return null;

	try {
		return JSON.parse(stored);
	} catch (e) {
		console.error('Failed to parse stored consent:', e);
		return null;
	}
};

interface StoreConfig {
	trackingBlockerConfig?: TrackingBlockerConfig;
}

/**
 * Creates a new consent manager store instance.
 *
 * @remarks
 * This function initializes a new consent management store with:
 * - Persistence through localStorage
 * - Initial state handling
 * - Consent management methods
 * - Privacy settings
 * - Compliance configuration
 *
 * The store is typically used through React hooks but can also be
 * accessed directly for non-React applications.
 *
 * @param namespace - Optional namespace for the store instance
 * @returns A Zustand store instance with consent management functionality
 *
 * @example
 * Basic usage:
 * ```typescript
 * const store = createConsentManagerStore();
 *
 * // Subscribe to state changes
 * const unsubscribe = store.subscribe(
 *   state => console.log('Consent updated:', state.consents)
 * );
 *
 * // Update consent
 * store.getState().setConsent('analytics', true);
 * ```
 *
 * @example
 * Custom namespace:
 * ```typescript
 * const store = createConsentManagerStore('MyApp');
 *
 * // Access from window
 * const state = window.MyApp.getState();
 * ```
 *
 * @public
 */
export const createConsentManagerStore = (
	namespace: string | undefined = 'c15tStore',
	config?: StoreConfig
) => {
	// Load initial state from localStorage if available
	const storedConsent = getStoredConsent();

	// Initialize tracking blocker
	const trackingBlocker =
		typeof window !== 'undefined'
			? createTrackingBlocker(
					config?.trackingBlockerConfig || {},
					storedConsent?.consents || initialState.consents
				)
			: null;

	const store = createStore<PrivacyConsentState>((set, get) => ({
		...initialState,
		...(storedConsent
			? {
					consents: storedConsent.consents,
					consentInfo: storedConsent.consentInfo as {
						time: number;
						type: 'necessary' | 'all' | 'custom';
					} | null,
					showPopup: false, // Don't show popup if we have stored consent
				}
			: {
					showPopup: true, // Show popup if no stored consent
				}),

		/**
		 * Updates the consent state for a specific consent type and persists the change.
		 *
		 * @param name - The consent type to update
		 * @param value - The new consent value
		 *
		 * @remarks
		 * This function:
		 * 1. Updates the consent state
		 * 2. Persists changes to localStorage
		 * 3. Triggers consent mode update
		 */
		setConsent: (name, value) => {
			set((state) => {
				const consentType = state.consentTypes.find(
					(type) => type.name === name
				);

				// Don't allow changes to disabled consent types
				if (consentType?.disabled) {
					return state;
				}

				const newConsents = { ...state.consents, [name]: value };
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({
						consents: newConsents,
						consentInfo: state.consentInfo,
					})
				);

				// Update tracking blocker with new consents
				trackingBlocker?.updateConsents(newConsents);

				return { consents: newConsents };
			});
			get().updateConsentMode();
		},

		/**
		 * Controls the visibility of the consent popup.
		 *
		 * @param show - Whether to show the popup
		 * @param force - Whether to force showing the popup regardless of consent state
		 *
		 * @remarks
		 * The popup will only be shown if:
		 * - Forcing is enabled, or
		 * - No stored consent exists and no current consent is given
		 */
		setShowPopup: (show, force = false) => {
			const state = get();
			const storedConsent = getStoredConsent();
			if (force || (!storedConsent && !state.consentInfo && show)) {
				set({ showPopup: show });
			}
		},

		/**
		 * Controls the visibility of the privacy dialog.
		 *
		 * @param isOpen - Whether the dialog should be open
		 */
		setIsPrivacyDialogOpen: (isOpen) => {
			set({ isPrivacyDialogOpen: isOpen });
		},

		/**
		 * Saves user consent preferences and triggers related callbacks.
		 *
		 * @param type - The type of consent being saved
		 *
		 * @remarks
		 * This function:
		 * 1. Updates consent states based on type
		 * 2. Records consent timestamp
		 * 3. Persists to localStorage
		 * 4. Updates UI state
		 * 5. Triggers callbacks
		 */
		saveConsents: (type) => {
			const {
				callbacks,
				updateConsentMode,
				consents,
				consentTypes,
				includeNonDisplayedConsents,
			} = get();
			const newConsents = { ...consents };
			if (type === 'all') {
				for (const consent of consentTypes) {
					newConsents[consent.name] = true;
				}
			} else if (type === 'necessary') {
				for (const consent of consentTypes) {
					newConsents[consent.name] = consent.name === 'necessary';
				}
			}

			const consentInfo = {
				time: Date.now(),
				type: type as 'necessary' | 'all' | 'custom',
			};

			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					consents: newConsents,
					consentInfo,
				})
			);

			// Update tracking blocker with new consents
			trackingBlocker?.updateConsents(newConsents);

			set({
				consents: newConsents,
				showPopup: false,
				consentInfo,
			});

			updateConsentMode();
			callbacks.onConsentGiven?.();
			callbacks.onPreferenceExpressed?.();
		},

		/**
		 * Resets all consent preferences to their default values.
		 *
		 * @remarks
		 * This function:
		 * 1. Resets all consents to their type-specific defaults
		 * 2. Clears consent information
		 * 3. Removes stored consent from localStorage
		 */
		resetConsents: () => {
			set((state) => {
				const resetState = {
					consents: consentTypes.reduce((acc, consent) => {
						acc[consent.name] = consent.defaultValue;
						return acc;
					}, {} as ConsentState),
					consentInfo: null,
				};
				localStorage.removeItem(STORAGE_KEY);
				return resetState;
			});
		},

		/**
		 * Updates the active GDPR consent types.
		 *
		 * @param types - Array of consent types to activate
		 */
		setGdprTypes: (types) => set({ gdprTypes: types }),

		/**
		 * Updates compliance settings for a specific region.
		 *
		 * @param region - The region to update
		 * @param settings - New compliance settings
		 *
		 * @remarks
		 * Merges new settings with existing ones for the specified region
		 */
		setComplianceSetting: (region, settings) =>
			set((state) => ({
				complianceSettings: {
					...state.complianceSettings,
					[region]: { ...state.complianceSettings[region], ...settings },
				},
			})),

		/**
		 * Resets compliance settings to their default values.
		 */
		resetComplianceSettings: () =>
			set({
				complianceSettings: initialState.complianceSettings,
			}),

		/**
		 * Sets a callback for a specific consent event.
		 *
		 * @param name - The callback event name
		 * @param callback - The callback function
		 */
		setCallback: (name, callback) =>
			set((state) => ({
				callbacks: { ...state.callbacks, [name]: callback },
			})),

		/**
		 * Updates the user's detected country.
		 *
		 * @param country - The country code
		 */
		setDetectedCountry: (country) => set({ detectedCountry: country }),

		/**
		 * Retrieves the list of consent types that should be displayed.
		 *
		 * @returns Array of consent types that match the active GDPR types
		 */
		getDisplayedConsents: () => {
			const { gdprTypes, consentTypes } = get();
			return consentTypes.filter((consent) => gdprTypes.includes(consent.name));
		},

		/**
		 * Checks if the user has provided any form of consent.
		 *
		 * @returns True if any consent has been given
		 */
		hasConsented: () => {
			const { consentInfo } = get();
			return hasConsented(consentInfo);
		},

		/**
		 * Clears all consent data and resets to initial state.
		 *
		 * @remarks
		 * This function:
		 * 1. Resets state to initial values
		 * 2. Removes stored consent from localStorage
		 */
		clearAllData: () => {
			set(initialState);
			localStorage.removeItem(STORAGE_KEY);
		},

		/**
		 * Updates the consent mode in external systems.
		 *
		 * @remarks
		 * Currently commented out, but designed to update Google Tag Manager
		 * consent states based on user preferences.
		 */
		updateConsentMode: () => {
			const effectiveConsents = get().getEffectiveConsents();
			// if (typeof window !== 'undefined' && window.gtag) {
			//   window.gtag('consent', 'update', {
			//     'ad_storage': effectiveConsents.marketing ? 'granted' : 'denied',
			//     'analytics_storage': effectiveConsents.measurement ? 'granted' : 'denied',
			//     'ad_user_data': effectiveConsents.ad_user_data ? 'granted' : 'denied',
			//     'ad_personalization': effectiveConsents.ad_personalization ? 'granted' : 'denied',
			//   });
			// }
		},

		/**
		 * Updates privacy-related settings.
		 *
		 * @param settings - New privacy settings
		 */
		setPrivacySettings: (settings) =>
			set((state) => ({
				privacySettings: { ...state.privacySettings, ...settings },
			})),

		/**
		 * Gets the effective consent states after applying privacy settings.
		 *
		 * @returns The effective consent states considering Do Not Track
		 */
		getEffectiveConsents: () => {
			const { consents, privacySettings } = get();
			return getEffectiveConsents(consents, privacySettings.honorDoNotTrack);
		},

		/**
		 * Checks if consent has been given for a specific type.
		 *
		 * @param consentType - The consent type to check
		 * @returns True if consent is granted for the specified type
		 */
		hasConsentFor: (consentType) => {
			const { consents, privacySettings } = get();
			return hasConsentFor(
				consentType,
				consents,
				privacySettings.honorDoNotTrack
			);
		},

		/**
		 * Controls whether non-displayed consents should be included.
		 *
		 * @param include - Whether to include non-displayed consents
		 */
		setIncludeNonDisplayedConsents: (include) =>
			set({ includeNonDisplayedConsents: include }),

		/**
		 * Updates the translation configuration.
		 * @param config - The new translation configuration
		 */
		setTranslationConfig: (config: TranslationConfig) => {
			set({ translationConfig: config });
		},
	}));

	if (typeof window !== 'undefined') {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[namespace] = store;
	}

	return store;
};

export default createConsentManagerStore;
