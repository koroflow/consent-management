'use client';
import { createConsentManagerStore } from 'c15t-reloaded'; // Adjust the import path as necessary
import type { PrivacyConsentState } from 'c15t-reloaded';
import { useContext, useEffect, useState } from 'react';
import { ConsentStateContext } from '../context/consent-manager-context';

/**
 * A custom React hook that provides access to the privacy consent state and management methods.
 *
 * @remarks
 * This hook serves as the primary interface for interacting with the consent management system.
 * It provides access to:
 * - Current consent states for different types (analytics, marketing, etc.)
 * - Methods to update and save consent preferences
 * - Compliance settings and region detection
 * - State persistence and retrieval
 *
 * The hook combines both the static state and dynamic methods from the consent manager store,
 * providing a unified API for consent management.
 *
 * @throws {Error}
 * Throws if used outside of a {@link ConsentManagerProvider} context with the message
 * "useConsentManager must be used within a ConsentManagerProvider"
 *
 * @returns {PrivacyConsentState} Returns a combined object containing all properties and methods
 * from the consent manager.
 *
 * @example
 * Basic consent checking:
 * ```tsx
 * function AnalyticsFeature() {
 *   const { hasConsent, isConsentRequired } = useConsentManager();
 *
 *   // Check if analytics consent is required and granted
 *   if (isConsentRequired && !hasConsent('analytics')) {
 *     return <p>Please accept analytics cookies to use this feature.</p>;
 *   }
 *
 *   return <div>Analytics Feature Content</div>;
 * }
 * ```
 *
 * @see {@link ConsentManagerProvider} For the provider component that makes this hook available
 * @see {@link PrivacyConsentState} For the complete state interface
 * @see {@link AllConsentNames} For available consent type names
 *
 * @public
 */
export function useConsentManager(): {
	state: PrivacyConsentState;
	// saveConsents: (type: string) => void;
	// setShowPopup: (show: boolean, force?: boolean) => void;
} {
	const context = useContext(ConsentStateContext);

	if (!context) {
		throw new Error(
			'useConsentManager must be used within a ConsentManagerProvider'
		);
	}

	const [consentState, setConsentState] = useState<PrivacyConsentState>(
		context.state
	);

	useEffect(() => {
		const store = createConsentManagerStore();
		const unsubscribe = store.subscribe((newState) => {
			setConsentState(newState);
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return {
		state: consentState,
		// saveConsents: store.saveConsents.bind(store),

		// Add any additional methods or properties you need to expose
	};
}
