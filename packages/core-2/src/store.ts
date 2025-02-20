/**
 * @packageDocumentation
 * Implements the core consent management store using a singleton pattern.
 * This module provides the main store creation and management functionality.
 */

import {
	getEffectiveConsents,
	hasConsentFor,
	hasConsented,
} from './libs/consent-utils';
import type { TrackingBlockerConfig } from './libs/tracking-blocker';
import { createTrackingBlocker } from './libs/tracking-blocker';
import { initialState } from './store.initial-state';
import type { PrivacyConsentState } from './store.type';
import type {
	AllConsentNames,
	CallbackFunction,
	Callbacks,
	ComplianceRegion,
	ComplianceSettings,
	ConsentState,
	ConsentType,
	PrivacySettings,
	TranslationConfig,
} from './types';
import { localStorage, window as win } from './utils/global-helpers';

/** Storage key for persisting consent data in localStorage */
const STORAGE_KEY = 'privacy-consent-storage';

/**
 * Singleton class that manages consent state and operations
 */
export class ConsentManager implements PrivacyConsentState {
	private static instance: ConsentManager | null = null;
	private subscribers: Set<(state: PrivacyConsentState) => void> = new Set();
	private trackingBlocker: ReturnType<typeof createTrackingBlocker> | null =
		null;

	// Initialize all state properties from PrivacyConsentState
	consents: ConsentState = initialState.consents;
	consentInfo = initialState.consentInfo;
	showPopup = initialState.showPopup;
	gdprTypes = initialState.gdprTypes;
	isPrivacyDialogOpen = initialState.isPrivacyDialogOpen;
	complianceSettings = initialState.complianceSettings;
	callbacks = initialState.callbacks;
	detectedCountry = initialState.detectedCountry;
	privacySettings = initialState.privacySettings;
	translationConfig = initialState.translationConfig;
	noStyle = initialState.noStyle;
	includeNonDisplayedConsents = initialState.includeNonDisplayedConsents;
	consentTypes = initialState.consentTypes;

	private constructor(
		namespace?: string,
		config?: { trackingBlockerConfig?: TrackingBlockerConfig }
	) {
		// Initialize from stored consent if available
		const storedConsent = this.getStoredConsent();
		if (storedConsent) {
			this.consents = storedConsent.consents;
			this.consentInfo = storedConsent.consentInfo as typeof this.consentInfo;
			this.showPopup = false;
		}

		// Initialize tracking blocker
		if (win) {
			this.trackingBlocker = createTrackingBlocker(
				config?.trackingBlockerConfig || {},
				storedConsent?.consents || initialState.consents
			);

			// Add to window object if namespace provided
			if (namespace) {
				(win as unknown as Record<string, ConsentManager>)[namespace] = this;
			}
		}
	}

	/**
	 * Gets the singleton instance of the consent manager
	 */
	static getInstance(
		namespace?: string,
		config?: { trackingBlockerConfig?: TrackingBlockerConfig }
	): ConsentManager {
		if (!ConsentManager.instance) {
			ConsentManager.instance = new ConsentManager(namespace, config);
		}
		return ConsentManager.instance;
	}

	/**
	 * Subscribe to state changes
	 */
	subscribe(callback: (state: PrivacyConsentState) => void): () => void {
		this.subscribers.add(callback);
		return () => this.subscribers.delete(callback);
	}

	/**
	 * Notify subscribers of state changes
	 */
	private notifySubscribers(): void {
		for (const callback of this.subscribers) {
			callback(this);
		}
	}

	/**
	 * Get stored consent from localStorage
	 */
	private getStoredConsent() {
		if (!win) {
			return null;
		}

		const stored = localStorage?.getItem(STORAGE_KEY);
		if (!stored) {
			return null;
		}

		try {
			return JSON.parse(stored);
		} catch (e) {
			// biome-ignore lint/suspicious/noConsole: we want to log errors
			console.error('Failed to parse stored consent:', e);
			return null;
		}
	}

	// Implement all the required methods from PrivacyConsentState
	setConsent(name: string, value: boolean): void {
		const consentType = this.consentTypes.find((type) => type.name === name);
		if (consentType?.disabled) {
			return;
		}

		this.consents = { ...this.consents, [name]: value };
		this.trackingBlocker?.updateConsents(this.consents);
		this.updateConsentMode();
		this.notifySubscribers();
	}

	setShowPopup(show: boolean, force = false): void {
		debugger;
		const storedConsent = this.getStoredConsent();
		if (force || (!storedConsent && !this.consentInfo && show)) {
			this.showPopup = show;
			this.notifySubscribers();
		}
	}

	setIsPrivacyDialogOpen(isOpen: boolean): void {
		this.isPrivacyDialogOpen = isOpen;
		this.notifySubscribers();
	}

	saveConsents(type: 'all' | 'custom' | 'necessary'): void {
		debugger;
		const newConsents = { ...this.consents };

		if (type === 'all') {
			for (const consent of this.consentTypes) {
				newConsents[consent.name] = true;
			}
		} else if (type === 'necessary') {
			for (const consent of this.consentTypes) {
				newConsents[consent.name] = consent.name === 'necessary';
			}
		}

		const consentInfo = {
			time: Date.now(),
			type: type,
		};

		localStorage?.setItem(
			STORAGE_KEY,
			JSON.stringify({
				consents: newConsents,
				consentInfo,
			})
		);

		this.trackingBlocker?.updateConsents(newConsents);
		this.consents = newConsents;
		this.showPopup = false;
		this.consentInfo = consentInfo;

		this.updateConsentMode();
		this.callbacks.onConsentGiven?.();
		this.callbacks.onPreferenceExpressed?.();
		this.notifySubscribers();
	}

	resetConsents(): void {
		this.consents = this.consentTypes.reduce((acc, consent) => {
			acc[consent.name] = consent.defaultValue;
			return acc;
		}, {} as ConsentState);
		localStorage?.removeItem(STORAGE_KEY);
		this.notifySubscribers();
	}

	setGdprTypes(types: AllConsentNames[]): void {
		this.gdprTypes = types;
		this.notifySubscribers();
	}

	setComplianceSetting(
		region: ComplianceRegion,
		settings: Partial<ComplianceSettings>
	): void {
		this.complianceSettings = {
			...this.complianceSettings,
			[region]: { ...this.complianceSettings[region], ...settings },
		};
		this.notifySubscribers();
	}

	resetComplianceSettings(): void {
		this.complianceSettings = initialState.complianceSettings;
		this.notifySubscribers();
	}

	setCallback(
		name: keyof Callbacks,
		callback: CallbackFunction | undefined
	): void {
		if (callback) {
			this.callbacks = { ...this.callbacks, [name]: callback };
		} else {
			delete this.callbacks[name];
		}
		this.notifySubscribers();
	}

	setDetectedCountry(country: string): void {
		this.detectedCountry = country;
		this.notifySubscribers();
	}

	getDisplayedConsents(): ConsentType[] {
		return this.consentTypes.filter((consent) =>
			this.gdprTypes.includes(consent.name)
		);
	}

	hasConsented(): boolean {
		return hasConsented(this.consentInfo);
	}

	clearAllData(): void {
		this.consents = initialState.consents;
		this.consentInfo = initialState.consentInfo;
		this.showPopup = initialState.showPopup;
		this.gdprTypes = initialState.gdprTypes;
		this.isPrivacyDialogOpen = initialState.isPrivacyDialogOpen;
		this.complianceSettings = initialState.complianceSettings;
		this.callbacks = initialState.callbacks;
		this.detectedCountry = initialState.detectedCountry;
		this.privacySettings = initialState.privacySettings;
		this.translationConfig = initialState.translationConfig;
		this.noStyle = initialState.noStyle;
		this.includeNonDisplayedConsents = initialState.includeNonDisplayedConsents;
		this.consentTypes = initialState.consentTypes;
		localStorage?.removeItem(STORAGE_KEY);
		this.notifySubscribers();
	}

	updateConsentMode(): void {
		const effectiveConsents = this.getEffectiveConsents();
		// if (typeof window !== 'undefined' && window.gtag) {
		//   window.gtag('consent', 'update', {
		//     'ad_storage': effectiveConsents.marketing ? 'granted' : 'denied',
		//     'analytics_storage': effectiveConsents.measurement ? 'granted' : 'denied',
		//     'ad_user_data': effectiveConsents.ad_user_data ? 'granted' : 'denied',
		//     'ad_personalization': effectiveConsents.ad_personalization ? 'granted' : 'denied',
		//   });
		// }
		this.notifySubscribers();
	}

	setPrivacySettings(settings: Partial<PrivacySettings>): void {
		this.privacySettings = { ...this.privacySettings, ...settings };
		this.notifySubscribers();
	}

	getEffectiveConsents() {
		return getEffectiveConsents(
			this.consents,
			this.privacySettings.honorDoNotTrack
		);
	}

	hasConsentFor(consentType: AllConsentNames): boolean {
		return hasConsentFor(
			consentType,
			this.consents,
			this.privacySettings.honorDoNotTrack
		);
	}

	setIncludeNonDisplayedConsents(include: boolean): void {
		this.includeNonDisplayedConsents = include;
		this.notifySubscribers();
	}

	setTranslationConfig(config: TranslationConfig): void {
		this.translationConfig = config;
		this.notifySubscribers();
	}

	setNoStyle(noStyle: boolean): void {
		this.noStyle = noStyle;
		this.notifySubscribers();
	}
}

export const createConsentManagerStore = (
	namespace?: string,
	config?: { trackingBlockerConfig?: TrackingBlockerConfig }
) => ConsentManager.getInstance(namespace, config);

export default createConsentManagerStore;
