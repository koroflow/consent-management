/**
 * Create a stub for React to avoid direct dependency when React is not installed
 */
type ReactHook<T> = () => T;

// Type for the consent store state
interface ConsentState {
	isLoading: boolean;
	hasConsented: boolean | null;
	preferences: Record<string, boolean> | null;
	error: Error | null;
	lastUpdated: number | null;
}

// Type for the consent store actions
interface ConsentActions {
	setConsent: (preferences: Record<string, boolean>) => Promise<void>;
	acceptAll: () => Promise<void>;
	declineAll: () => Promise<void>;
	refreshStatus: () => Promise<void>;
	clearError: () => void;
}

// Combined store type
type ConsentStore = ConsentState & ConsentActions;

/**
 * Configuration options for the c15t client
 */
interface C15tClientConfig {
	/**
	 * Base URL for API endpoints
	 * @default '/api/consent'
	 */
	baseUrl?: string;

	/**
	 * Auto-refresh interval in milliseconds
	 * Set to 0 to disable auto-refresh
	 * @default 0 (disabled)
	 */
	refreshInterval?: number;

	/**
	 * Default preferences to use for acceptAll
	 */
	defaultPreferences?: {
		analytics?: boolean;
		marketing?: boolean;
		preferences?: boolean;
		[key: string]: boolean | undefined;
	};
}

/**
 * Creates a c15t client for React applications
 *
 * @param config Client configuration options
 * @returns A client object with store and hooks
 */
export function createConsentClient(config: C15tClientConfig = {}) {
	const {
		baseUrl = '/api/consent',
		refreshInterval = 0,
		defaultPreferences = {
			analytics: true,
			marketing: true,
			preferences: true,
		},
	} = config;

	// Define a store type based on common store libraries
	type StoreAPI<T> = {
		getState: () => T;
		setState: (partial: Partial<T> | ((state: T) => Partial<T>)) => void;
		subscribe: (listener: (state: T) => void) => () => void;
	};

	// Create a basic store implementation
	function createStore<T extends object>(
		createState: (
			set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void,
			get: () => T
		) => T
	): StoreAPI<T> {
		let state: T;
		const listeners = new Set<(state: T) => void>();

		const setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
			const nextState =
				typeof partial === 'function'
					? { ...state, ...partial(state) }
					: { ...state, ...partial };

			state = nextState;
			listeners.forEach((listener) => listener(state));
		};

		const getState = () => state;

		const subscribe = (listener: (state: T) => void) => {
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

		clearError: () => {
			set({ error: null });
		},
	}));

	// Create a function that mimics a React hook
	// This should be compatible with most React environments
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

	// Hook to conditionally render content based on consent
	const useConditionalContent = (requiredConsent: string | string[]) => {
		const store = useConsent();

		const canShow = () => {
			if (store.isLoading || !store.hasConsented || !store.preferences)
				return false;

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
