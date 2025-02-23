'use client';

import {
	type PrivacyConsentState,
	createConsentManagerStore,
	defaultTranslationConfig,
	initialState,
} from 'c15t-reloaded';
import { useEffect, useMemo, useState } from 'react';
import { ConsentStateContext } from '../context/consent-manager-context';
import type { ConsentManagerProviderProps } from '../types/consent-manager';
import {
	detectBrowserLanguage,
	mergeTranslationConfigs,
} from '../utils/translations';

/**
 * Provider component for consent management functionality.
 *
 * @remarks
 * This component initializes and manages the consent management system, including:
 * - Setting up the consent store with initial configuration
 * - Detecting user's region for compliance
 * - Managing consent state updates
 * - Providing access to consent management throughout the app
 * - Injecting default styles (unless noStyle is true)
 *
 * @public
 */
export function ConsentManagerProvider({
	children,
	initialGdprTypes,
	initialComplianceSettings,
	namespace = 'c15tStore',
	noStyle = false,
	translationConfig,
	trackingBlockerConfig,
}: ConsentManagerProviderProps) {
	const preparedTranslationConfig = useMemo(() => {
		const mergedConfig = mergeTranslationConfigs(
			defaultTranslationConfig,
			translationConfig
		);
		const defaultLanguage = detectBrowserLanguage(
			mergedConfig.translations,
			mergedConfig.defaultLanguage,
			mergedConfig.disableAutoLanguageSwitch
		);
		return { ...mergedConfig, defaultLanguage };
	}, [translationConfig]);

	const store = useMemo(
		() => createConsentManagerStore(namespace, { trackingBlockerConfig }),
		[namespace, trackingBlockerConfig]
	);

	// Use the imported initial state and preparedTranslationConfig
	const [state, setState] = useState<PrivacyConsentState>(() => ({
		...initialState,
		translationConfig: preparedTranslationConfig, // Set the prepared translation config
		//@ts-expect-error - noStyle is not defined on the store
		noStyle: store.noStyle ?? false,
	}));

	useEffect(() => {
		// Initialize GDPR types if provided
		if (initialGdprTypes) {
			setState((prevState) => ({
				...prevState,
				gdprTypes: initialGdprTypes,
			}));
		}

		// Initialize compliance settings if provided
		if (initialComplianceSettings) {
			setState((prevState) => ({
				...prevState,
				complianceSettings: initialComplianceSettings,
			}));
		}

		// Update noStyle when prop changes
		setState((prevState) => ({ ...prevState, noStyle }));

		// Set detected country
		const country =
			document
				.querySelector('meta[name="user-country"]')
				?.getAttribute('content') || 'US';
		setState((prevState) => ({
			...prevState,
			detectedCountry: country,
		}));

		// Update translationConfig when it changes
		setState((prevState) => ({
			...prevState,
			translationConfig: preparedTranslationConfig,
		}));

		// Cleanup logic if needed
	}, [
		initialGdprTypes,
		initialComplianceSettings,
		noStyle,
		preparedTranslationConfig,
	]);

	useEffect(() => {
		const unsubscribe = store.subscribe((newState: PrivacyConsentState) => {
			setState(newState);
		});

		return () => {
			unsubscribe();
		};
	}, [store]);

	const contextValue = useMemo(
		() => ({
			state,
			store,
		}),
		[state, store]
	);

	return (
		<ConsentStateContext.Provider value={contextValue}>
			{children}
		</ConsentStateContext.Provider>
	);
}
