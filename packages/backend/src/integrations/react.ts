/**
 * React integration for c15t consent management system
 *
 * This module provides React hooks and state management for the c15t consent system.
 * It implements a lightweight store and hooks for integrating consent management
 * into React applications without requiring specific React dependencies.
 *
 * The implementation is designed to work in various React environments and can
 * also function in non-React environments by providing a fallback pattern.
 *
 * @example
 * ```tsx
 * // Initialize in your app
 * import { createConsentClient } from '@c15t/integrations/react';
 *
 * const consentClient = createConsentClient({
 *   baseUrl: '/api/c15t',
 *   refreshInterval: 60000, // Check every minute
 * });
 *
 * // Use in components
 * function ConsentBanner() {
 *   const { isLoading, hasConsented, acceptAll, declineAll } = consentClient.useConsent();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (hasConsented) return null;
 *
 *   return (
 *     <div className="consent-banner">
 *       <h2>We use cookies</h2>
 *       <button onClick={acceptAll}>Accept All</button>
 *       <button onClick={declineAll}>Decline All</button>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Type definition for a React-like hook function
 *
 * This type facilitates compatibility with React's hooks pattern
 * without requiring a direct dependency on React.
 *
 * @template T The return type of the hook
 */
type ReactHook<T> = () => T;

/**
 * State for the consent management store
 *
 * Contains the current consent status, preferences, and loading state.
 */
interface ConsentState {
	/**
	 * Whether consent data is currently being loaded
	 */
	isLoading: boolean;

	/**
	 * Whether the subject has provided consent
	 * - `true`: Subject has provided at least one consent
	 * - `false`: Subject has explicitly declined all consent
	 * - `null`: Consent status hasn't been determined yet
	 */
	hasConsented: boolean | null;

	/**
	 * Map of consent purposes to their consent status
	 * Key is the consentPurpose ID, value is a boolean indicating consent
	 */
	preferences: Record<string, boolean> | null;

	/**
	 * Error that occurred during consent operations
	 */
	error: Error | null;

	/**
	 * Timestamp of when consent was last updated
	 */
	lastUpdated: number | null;
}

/**
 * Actions that can be performed on the consent store
 *
 * These actions allow modifying the consent state and interacting
 * with the consent management backend.
 */
interface ConsentActions {
	/**
	 * Set specific consent preferences
	 *
	 * @param preferences - Map of consentPurpose IDs to consent values
	 * @returns Promise that resolves when consent is updated
	 */
	setConsent: (preferences: Record<string, boolean>) => Promise<void>;

	/**
	 * Accept all consent purposes
	 * Uses the default preferences defined in configuration
	 *
	 * @returns Promise that resolves when consent is updated
	 */
	acceptAll: () => Promise<void>;

	/**
	 * Decline all consent purposes
	 * Sets all purposes to `false`
	 *
	 * @returns Promise that resolves when consent is updated
	 */
	declineAll: () => Promise<void>;

	/**
	 * Refresh the consent status from the server
	 *
	 * @returns Promise that resolves when consent status is refreshed
	 */
	refreshStatus: () => Promise<void>;

	/**
	 * Clear any error state in the store
	 */
	clearError: () => void;
}

/**
 * Combined type for the consent store containing both state and actions
 */
type ConsentStore = ConsentState & ConsentActions;

/**
 * Configuration options for the c15t React client
 */
interface c15tClientConfig {
	/**
	 * Base URL for API endpoints
	 * @default '/api/c15t'
	 */
	baseUrl?: string;

	/**
	 * Auto-refresh interval in milliseconds
	 * Set to 0 to disable auto-refresh
	 * @default 0 (disabled)
	 */
	refreshInterval?: number;

	/**
	 * Default preferences to use for acceptAll action
	 * These values determine what gets set when a subject accepts all consent
	 *
	 * @example
	 * ```ts
	 * {
	 *   analytics: true,
	 *   marketing: true,
	 *   preferences: true
	 * }
	 * ```
	 */
	defaultPreferences?: {
		analytics?: boolean;
		marketing?: boolean;
		preferences?: boolean;
		[key: string]: boolean | undefined;
	};
}

/**
 * Interface for basic store operations
 *
 * Provides a minimal store API similar to common state management libraries
 *
 * @template T The type of state stored in the store
 */
interface StoreAPI<T> {
	/**
	 * Get the current state
	 * @returns The current state
	 */
	getState: () => T;

	/**
	 * Update the state
	 * @param partial - Partial state or function that returns partial state
	 */
	setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;

	/**
	 * Subscribe to state changes
	 * @param listener - Function to call when state changes
	 * @returns Unsubscribe function
	 */
	subscribe: (listener: (state: T) => void) => () => void;
}

/**
 * Result of the useConditionalContent hook
 */
interface ConditionalContentResult {
	/**
	 * Whether consent data is currently loading
	 */
	isLoading: boolean;

	/**
	 * Whether the subject has given any consent
	 */
	hasConsented: boolean | null;

	/**
	 * Whether content can be shown based on required consent
	 */
	canShow: boolean;

	/**
	 * Current consent preferences
	 */
	preferences: Record<string, boolean> | null;
}

/**
 * Result of the createConsentClient function
 */
interface ConsentClient {
	/**
	 * Store for managing consent state
	 */
	store: StoreAPI<ConsentStore>;

	/**
	 * Hook for accessing consent state and actions
	 */
	useConsent: ReactHook<ConsentStore>;

	/**
	 * Hook for conditionally showing content based on consent
	 */
	useConditionalContent: (
		requiredConsent: string | string[]
	) => ConditionalContentResult;
}

/**
 * Creates a c15t client for React applications
 *
 * This function creates a store and hooks for managing consent in React applications.
 * It provides a lightweight implementation that works in various React environments
 * and degrades gracefully in non-React environments.
 *
 * @example
 * ```tsx
 * // Create a client
 * const client = createConsentClient({
 *   baseUrl: '/api/c15t',
 *   refreshInterval: 60000,
 *   defaultPreferences: {
 *     analytics: true,
 *     marketing: false
 *   }
 * });
 *
 * // Use in a component
 * function ConsentStatus() {
 *   const { preferences, refreshStatus } = client.useConsent();
 *
 *   return (
 *     <div>
 *       <h2>Your consent preferences:</h2>
 *       <pre>{JSON.stringify(preferences, null, 2)}</pre>
 *       <button onClick={refreshStatus}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @param config - Client configuration options
 * @returns A client object with store and hooks
 */
export function createConsentClient(
	config: c15tClientConfig = {}
): ConsentClient {
	const {
		baseUrl = '/api/c15t',
		refreshInterval = 0,
		defaultPreferences = {
			analytics: true,
			marketing: true,
			preferences: true,
		},
	} = config;

	/**
	 * Create a basic store implementation
	 *
	 * This is a lightweight implementation of a store pattern similar to
	 * what libraries like Zustand provide, but without dependencies.
	 *
	 * @template T The type of state to store
	 * @param createState - Function that defines the initial state and actions
	 * @returns A store API with getState, setState, and subscribe methods
	 */
	function createStore<TState extends object>(
		createState: (
			set: (
				partial: Partial<TState> | ((state: TState) => Partial<TState>)
			) => void,
			get: () => TState
		) => TState
	): StoreAPI<TState> {
		let state: TState;
		const listeners = new Set<(state: TState) => void>();

		const setState = (
			partial: Partial<TState> | ((state: TState) => Partial<TState>)
		) => {
			const nextState =
				typeof partial === 'function'
					? { ...state, ...partial(state) }
					: { ...state, ...partial };

			state = nextState;
			// Replace forEach with for...of to fix linter error
			for (const listener of listeners) {
				listener(state);
			}
		};

		const getState = () => state;

		const subscribe = (listener: (state: TState) => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		};

		state = createState(setState, getState);

		return { getState, setState, subscribe };
	}

	// Create a store for consent state
	const consentStore = createStore<ConsentStore>((set, get) => ({
		// Initial state
		isLoading: true,
		hasConsented: null,
		preferences: null,
		error: null,
		lastUpdated: null,

		// Actions
		/**
		 * Update consent preferences for specific purposes
		 *
		 * @param preferences - Map of consentPurpose IDs to consent values
		 * @returns Promise that resolves when consent is updated
		 */
		setConsent: async (preferences: Record<string, boolean>) => {
			try {
				set({ isLoading: true, error: null });

				const response = await fetch(`${baseUrl}/set`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ preferences }),
					credentials: 'same-origin',
				});

				if (!response.ok) {
					throw new Error(`Failed to set consent: ${response.statusText}`);
				}

				const result = await response.json();

				set({
					isLoading: false,
					hasConsented: true,
					preferences: result.preferences || preferences,
					lastUpdated: Date.now(),
				});

				return result;
			} catch (error) {
				set({
					isLoading: false,
					error: error instanceof Error ? error : new Error(String(error)),
				});
				throw error;
			}
		},

		/**
		 * Accept all consent purposes using the default preferences
		 *
		 * @returns Promise that resolves when consent is updated
		 */
		acceptAll: async () => {
			// Filter out any undefined values from defaultPreferences
			const cleanPreferences = Object.entries(defaultPreferences)
				.filter(([_, value]) => value !== undefined)
				.reduce(
					(acc, [key, value]) => {
						acc[key] = value as boolean;
						return acc;
					},
					{} as Record<string, boolean>
				);

			return await get().setConsent(cleanPreferences);
		},

		/**
		 * Decline all consent purposes
		 *
		 * @returns Promise that resolves when consent is updated
		 */
		declineAll: async () => {
			const minimalConsent = Object.keys(defaultPreferences).reduce(
				(acc, key) => {
					acc[key] = false;
					return acc;
				},
				{} as Record<string, boolean>
			);

			return await get().setConsent(minimalConsent);
		},

		/**
		 * Refresh consent status from the server
		 *
		 * @returns Promise that resolves when consent status is refreshed
		 */
		refreshStatus: async () => {
			try {
				set({ isLoading: true, error: null });

				const response = await fetch(`${baseUrl}/status`, {
					credentials: 'same-origin',
				});

				if (!response.ok) {
					throw new Error(
						`Failed to get consent status: ${response.statusText}`
					);
				}

				const { consented, preferences } = await response.json();

				set({
					isLoading: false,
					hasConsented: consented,
					preferences: preferences,
					lastUpdated: Date.now(),
				});
			} catch (error) {
				set({
					isLoading: false,
					error: error instanceof Error ? error : new Error(String(error)),
				});
			}
		},

		/**
		 * Clear any error state
		 */
		clearError: () => {
			set({ error: null });
		},
	}));

	/**
	 * Hook for accessing consent state and actions
	 *
	 * This hook provides access to the current consent state and
	 * actions to update consent preferences. It initiates loading
	 * of consent status and sets up auto-refresh if configured.
	 *
	 * @returns Current consent state and actions
	 */
	const useConsent: ReactHook<ConsentStore> = () => {
		const storeState = consentStore.getState();

		// If in a non-React environment or SSR, just return the current state
		if (typeof window === 'undefined') {
			return storeState;
		}

		// For browser environments without full React
		// We return a simple object with the current state
		setTimeout(() => {
			// Initialize by refreshing status after initial render
			if (storeState.hasConsented === null && !storeState.isLoading) {
				storeState.refreshStatus();
			}

			// Set up refresh interval if configured
			if (refreshInterval > 0) {
				const intervalId = setInterval(() => {
					storeState.refreshStatus();
				}, refreshInterval);

				// Cleanup on window unload
				window.addEventListener('unload', () => clearInterval(intervalId));
			}
		}, 0);

		return storeState;
	};

	/**
	 * Hook to conditionally render content based on consent
	 *
	 * This hook checks if the subject has consented to specific purposes
	 * and returns a boolean indicating whether the content can be shown.
	 *
	 * @example
	 * ```tsx
	 * function AnalyticsComponent() {
	 *   const { canShow, isLoading } = client.useConditionalContent('analytics');
	 *
	 *   if (isLoading) return <div>Loading...</div>;
	 *   if (!canShow) return null;
	 *
	 *   return <div>Analytics content is shown because you consented!</div>;
	 * }
	 * ```
	 *
	 * @param requiredConsent - Required consent consentPurpose(s) to show content
	 * @returns Object with loading state, consent status, and whether content can be shown
	 */
	const useConditionalContent = (
		requiredConsent: string | string[]
	): ConditionalContentResult => {
		const store = useConsent();

		const canShow = () => {
			if (store.isLoading || !store.hasConsented || !store.preferences) {
				return false;
			}

			if (Array.isArray(requiredConsent)) {
				return requiredConsent.every((key) => store.preferences?.[key]);
			}

			return !!store.preferences[requiredConsent];
		};

		return {
			isLoading: store.isLoading,
			hasConsented: store.hasConsented,
			canShow: canShow(),
			preferences: store.preferences,
		};
	};

	// Return the client with store and hooks
	return {
		store: consentStore,
		useConsent,
		useConditionalContent,
	};
}
