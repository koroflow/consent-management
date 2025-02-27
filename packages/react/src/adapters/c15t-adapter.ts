import {
  createCompatibilityStore,
  type c15tClientConfig,
} from '@c15t/integrations/react';
import type { PrivacyConsentState } from 'c15t';
import type { TranslationConfig } from 'c15t';

/**
 * Creates a compatibility adapter that bridges between the new c15t API
 * and the existing React components that expect the core API.
 * 
 * This adapter allows gradually migrating from the old core library to the new c15t
 * package without having to rewrite all components at once.
 * 
 * @example
 * ```tsx
 * import { createC15tAdapter } from './adapters/c15t-adapter';
 * 
 * const adapter = createC15tAdapter({
 *   baseUrl: '/api/c15t',
 *   refreshInterval: 60000,
 *   defaultPreferences: {
 *     analytics: true,
 *     marketing: true,
 *     preferences: true,
 *   }
 * });
 * 
 * // Use the adapter with the existing ConsentManagerProvider
 * <ConsentManagerProvider
 *   store={adapter.store}
 *   initialComplianceSettings={adapter.getInitialComplianceSettings()}
 * >
 *   {children}
 * </ConsentManagerProvider>
 * ```
 * 
 * @param config - Configuration options for the c15t client
 * @returns An adapter object with store and helper methods
 */
export function createC15tAdapter(config: c15tClientConfig = {}) {
  // Create a compatibility store that follows the core API
  const compatStore = createCompatibilityStore(config);
  
  /**
   * Gets the initial compliance settings derived from the c15t configuration.
   * 
   * This is used to initialize the ConsentManagerProvider with settings
   * that match what's configured in the c15t client.
   */
  const getInitialComplianceSettings = () => {
    const state = compatStore.getState();
    return state.complianceSettings;
  };
  
  /**
   * Sets the translation configuration for the consent manager.
   * 
   * This updates both the compatibility store and the underlying c15t client.
   */
  const setTranslationConfig = (config: TranslationConfig) => {
    compatStore.getState().setTranslationConfig(config);
  };
  
  /**
   * Gets the current state of the consent manager.
   * 
   * This returns the state in the format expected by the existing components.
   */
  const getState = (): PrivacyConsentState => {
    return compatStore.getState();
  };
  
  /**
   * Updates the consent state.
   * 
   * This allows components to update specific parts of the consent state
   * and have those changes propagate to the underlying c15t client.
   */
  const setState = (partialState: Partial<PrivacyConsentState>) => {
    compatStore.setState(partialState);
  };
  
  /**
   * Subscribes to changes in the consent state.
   * 
   * This allows components to react to changes in consent preferences
   * whether they come from the UI or from the c15t client.
   */
  const subscribe = (listener: (state: PrivacyConsentState) => void) => {
    return compatStore.subscribe(listener);
  };
  
  /**
   * Direct access to the underlying c15t client.
   * 
   * This allows advanced use cases where components want to access
   * the new API directly instead of going through the compatibility layer.
   */
  const getC15tClient = () => {
    return compatStore.c15tClient;
  };
  
  return {
    // Store interface that mimics the core store
    store: {
      getState,
      setState,
      subscribe,
    },
    // Helper methods
    getInitialComplianceSettings,
    setTranslationConfig,
    getC15tClient,
    // Original compatibility store (for direct access if needed)
    compatStore,
  };
} 