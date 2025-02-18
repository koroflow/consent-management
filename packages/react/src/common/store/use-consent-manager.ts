'use client';
import type { PrivacyConsentState, createConsentManagerStore } from 'c15t';
import { useContext } from 'react';
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
 * Available methods include:
 * - `hasConsent(type: AllConsentNames)`: Check if a specific consent type is granted
 * - `setGdprTypes(types: AllConsentNames[])`: Update allowed GDPR consent types
 * - `saveConsents(type: 'all' | 'custom' | 'necessary')`: Save current consent preferences
 * - `getConsentedTypes()`: Get array of currently consented types
 * - `setComplianceSetting(region, settings)`: Update compliance settings for a region
 *
 * State properties include:
 * - `isConsentRequired`: Whether consent is required in the current region
 * - `detectedCountry`: The detected country code for the user
 * - `complianceSettings`: Region-specific compliance configuration
 * - `consents`: Current state of all consent types
 *
 * @throws {Error}
 * Throws if used outside of a {@link ConsentManagerProvider} context with the message
 * "useConsentManager must be used within a ConsentManagerProvider"
 *
 * @returns {PrivacyConsentState & ReturnType<typeof createConsentManagerStore>["getState"]}
 * Returns a combined object containing:
 * - All properties from {@link PrivacyConsentState}
 * - All methods from the consent manager store
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
 * @example
 * Managing consent preferences with Do Not Track support:
 * ```tsx
 * function ConsentControls() {
 *   const {
 *     setGdprTypes,
 *     saveConsents,
 *     getConsentedTypes,
 *     honorDoNotTrack
 *   } = useConsentManager();
 *
 *   const handleAcceptAll = () => {
 *     // Set all available consent types
 *     setGdprTypes(['necessary', 'functional', 'analytics', 'marketing']);
 *     // Save preferences with 'all' type
 *     saveConsents('all');
 *   };
 *
 *   const handleCustomize = () => {
 *     // Get current consents and add analytics
 *     const currentConsents = getConsentedTypes();
 *     setGdprTypes([...currentConsents, 'analytics']);
 *     // Save as custom preferences
 *     saveConsents('custom');
 *   };
 *
 *   // Respect Do Not Track setting
 *   if (honorDoNotTrack && window.navigator.doNotTrack === "1") {
 *     return <p>Respecting Do Not Track preference</p>;
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleAcceptAll}>Accept All</button>
 *       <button onClick={handleCustomize}>Customize</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Checking compliance requirements and region-specific settings:
 * ```tsx
 * function CookieBanner() {
 *   const {
 *     isConsentRequired,
 *     detectedCountry,
 *     complianceSettings,
 *     setComplianceSetting
 *   } = useConsentManager();
 *
 *   useEffect(() => {
 *     // Update settings for a specific region
 *     setComplianceSetting('EU', {
 *       requireConsent: true,
 *       showBanner: true,
 *       honorDoNotTrack: true
 *     });
 *   }, []);
 *
 *   if (!isConsentRequired) return null;
 *
 *   const settings = complianceSettings[detectedCountry];
 *
 *   return (
 *     <div>
 *       <h2>Cookie Preferences</h2>
 *       <p>Your current region: {detectedCountry}</p>
 *       {settings.showBanner && (
 *         <ConsentControls />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @see {@link ConsentManagerProvider} For the provider component that makes this hook available
 * @see {@link PrivacyConsentState} For the complete state interface
 * @see {@link AllConsentNames} For available consent type names
 *
 * @public
 */
export function useConsentManager(): PrivacyConsentState &
	ReturnType<typeof createConsentManagerStore>['getState'] {
	const context = useContext(ConsentStateContext);

	if (context === undefined) {
		throw new Error(
			'useConsentManager must be used within a ConsentManagerProvider'
		);
	}

	const storeState = context.store.getState();

	return {
		...context.state,
		...storeState,
	} as unknown as PrivacyConsentState &
		ReturnType<typeof createConsentManagerStore>['getState'];
}
