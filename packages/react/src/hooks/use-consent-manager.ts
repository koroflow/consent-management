import { useContext } from 'react';
import { ConsentStateContext } from '../context/consent-manager-context';

/**
 * Hook for accessing and managing consent state.
 *
 * @remarks
 * This hook provides access to the complete consent management API, including:
 * - Current consent state (what consents are given/required)
 * - Methods to update consents
 * - Compliance settings and region detection
 * - State persistence and retrieval
 *
 * The hook must be used within a ConsentManagerProvider component.
 *
 * @throws {Error}
 * Throws if used outside of a ConsentManagerProvider context.
 *
 * @returns Combined state and methods for consent management
 * @public
 */
export function useConsentManager() {
	const context = useContext(ConsentStateContext);

	if (context === undefined) {
		throw new Error(
			'useConsentManager must be used within a ConsentManagerProvider'
		);
	}

	return {
		...context.state,
		...context.store.getState(),
	};
}
