/**
 * @packageDocumentation
 * Implements the core consent management store using a singleton pattern.
 * This module provides the main store creation and management functionality.
 */

import { initialState } from './client.initial-state';
import type { PrivacyConsentState } from './client.type';
import {
	getEffectiveConsents,
	hasConsentFor,
	hasConsented,
} from './libs/consent-utils';
import type { TrackingBlockerConfig } from './libs/tracking-blocker';
import { createTrackingBlocker } from './libs/tracking-blocker';
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

function debugLog(methodName: string, args: unknown[]) {
	// biome-ignore lint/suspicious/noConsoleLog: we want to log debug messages
	// biome-ignore lint/suspicious/noConsole: we want to log debug messages
	console.log(`Called ${methodName} with arguments:`, args);
}

/**
 * Singleton class that manages consent state and operations
 */
export class ConsentManager {
	private static instance: ConsentManager | null = null;
	private subscribers: Set<(state: PrivacyConsentState) => void> = new Set();
	private trackingBlocker: ReturnType<typeof createTrackingBlocker> | null =
		null;

	// State object with only properties
	private state: PrivacyConsentState = initialState;

	private constructor(
		namespace?: string,
		config?: { trackingBlockerConfig?: TrackingBlockerConfig }
	) {
		const storedConsent = this.getStoredConsent();
		if (storedConsent) {
			this.state.consents = storedConsent.consents;
			this.state.consentInfo =
				storedConsent.consentInfo as typeof this.state.consentInfo;
			this.state.showPopup = false;
		}

		if (win) {
			this.trackingBlocker = createTrackingBlocker(
				config?.trackingBlockerConfig || {},
				storedConsent?.consents || initialState.consents
			);

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
			callback(this.state);
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
		debugLog('setConsent', [name, value]);
		const consentType = this.state.consentTypes.find(
			(type) => type.name === name
		);
		if (consentType?.disabled) {
			return;
		}

		this.state.consents = { ...this.state.consents, [name]: value };
		this.trackingBlocker?.updateConsents(this.state.consents);
		this.updateConsentMode();
		this.notifySubscribers();
	}

	setShowPopup(show: boolean, force = false): void {
		debugLog('setShowPopup', [show, force]);
		const storedConsent = this.getStoredConsent();
		console.log('storedConsent', {
			show,
			force,
			storedConsent,
			consentInfo: this.state.consentInfo,
		});
		if (force || (!storedConsent && !this.state.consentInfo && show)) {
			this.state.showPopup = show;
			this.notifySubscribers();
		}
	}

	setIsPrivacyDialogOpen(isOpen: boolean): void {
		debugLog('setIsPrivacyDialogOpen', [isOpen]);
		this.state.isPrivacyDialogOpen = isOpen;
		this.notifySubscribers();
	}

	saveConsents(type: 'all' | 'custom' | 'necessary'): void {
		debugLog('saveConsents', [type]);
		const newConsents = { ...this.state.consents };

		if (type === 'all') {
			for (const consent of this.state.consentTypes) {
				newConsents[consent.name] = true;
			}
		} else if (type === 'necessary') {
			for (const consent of this.state.consentTypes) {
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
		this.state.consents = newConsents;
		this.state.showPopup = false;
		this.state.consentInfo = consentInfo;

		this.updateConsentMode();
		this.state.callbacks.onConsentGiven?.();
		this.state.callbacks.onPreferenceExpressed?.();
		this.notifySubscribers();
	}

	resetConsents(): void {
		debugLog('resetConsents', []);
		this.state.consents = this.state.consentTypes.reduce((acc, consent) => {
			acc[consent.name] = consent.defaultValue;
			return acc;
		}, {} as ConsentState);
		localStorage?.removeItem(STORAGE_KEY);
		this.notifySubscribers();
	}

	setGdprTypes(types: AllConsentNames[]): void {
		debugLog('setGdprTypes', [types]);
		this.state.gdprTypes = types;
		this.notifySubscribers();
	}

	setComplianceSetting(
		region: ComplianceRegion,
		settings: Partial<ComplianceSettings>
	): void {
		debugLog('setComplianceSetting', [region, settings]);
		this.state.complianceSettings = {
			...this.state.complianceSettings,
			[region]: { ...this.state.complianceSettings[region], ...settings },
		};
		this.notifySubscribers();
	}

	resetComplianceSettings(): void {
		debugLog('resetComplianceSettings', []);
		this.state.complianceSettings = initialState.complianceSettings;
		this.notifySubscribers();
	}

	setCallback(
		name: keyof Callbacks,
		callback: CallbackFunction | undefined
	): void {
		debugLog('setCallback', [name, callback]);
		if (callback) {
			this.state.callbacks = { ...this.state.callbacks, [name]: callback };
		} else {
			delete this.state.callbacks[name];
		}
		this.notifySubscribers();
	}

	setDetectedCountry(country: string): void {
		debugLog('setDetectedCountry', [country]);
		this.state.detectedCountry = country;
		this.notifySubscribers();
	}

	getDisplayedConsents(): ConsentType[] {
		debugLog('getDisplayedConsents', []);
		return this.state.consentTypes.filter((consent) =>
			this.state.gdprTypes.includes(consent.name)
		);
	}

	hasConsented(): boolean {
		debugLog('hasConsented', []);
		return hasConsented(this.state.consentInfo);
	}

	clearAllData(): void {
		debugLog('clearAllData', []);
		this.state.consents = initialState.consents;
		this.state.consentInfo = initialState.consentInfo;
		this.state.showPopup = initialState.showPopup;
		this.state.gdprTypes = initialState.gdprTypes;
		this.state.isPrivacyDialogOpen = initialState.isPrivacyDialogOpen;
		this.state.complianceSettings = initialState.complianceSettings;
		this.state.callbacks = initialState.callbacks;
		this.state.detectedCountry = initialState.detectedCountry;
		this.state.privacySettings = initialState.privacySettings;
		this.state.translationConfig = initialState.translationConfig;
		this.state.noStyle = initialState.noStyle;
		this.state.includeNonDisplayedConsents =
			initialState.includeNonDisplayedConsents;
		this.state.consentTypes = initialState.consentTypes;
		localStorage?.removeItem(STORAGE_KEY);
		this.notifySubscribers();
	}

	updateConsentMode(): void {
		debugLog('updateConsentMode', []);
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
		debugLog('setPrivacySettings', [settings]);
		this.state.privacySettings = {
			...this.state.privacySettings,
			...settings,
		};
		this.notifySubscribers();
	}

	getEffectiveConsents() {
		debugLog('getEffectiveConsents', []);
		return getEffectiveConsents(
			this.state.consents,
			this.state.privacySettings.honorDoNotTrack
		);
	}

	hasConsentFor(consentType: AllConsentNames): boolean {
		debugLog('hasConsentFor', [consentType]);
		return hasConsentFor(
			consentType,
			this.state.consents,
			this.state.privacySettings.honorDoNotTrack
		);
	}

	setIncludeNonDisplayedConsents(include: boolean): void {
		debugLog('setIncludeNonDisplayedConsents', [include]);
		this.state.includeNonDisplayedConsents = include;
		this.notifySubscribers();
	}

	setTranslationConfig(config: TranslationConfig): void {
		debugLog('setTranslationConfig', [config]);
		this.state.translationConfig = config;
		this.notifySubscribers();
	}

	setNoStyle(noStyle: boolean): void {
		debugLog('setNoStyle', [noStyle]);
		this.state.noStyle = noStyle;
		this.notifySubscribers();
	}
}

export const createConsentManagerStore = (
	namespace?: string,
	config?: { trackingBlockerConfig?: TrackingBlockerConfig }
) => ConsentManager.getInstance(namespace, config);

export default createConsentManagerStore;
