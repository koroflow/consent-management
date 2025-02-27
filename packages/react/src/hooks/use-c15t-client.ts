import { useContext } from 'react';
import { ConsentStateContext } from '../context/consent-manager-context';

/**
 * Hook for accessing the c15t client directly.
 * 
 * This hook provides access to the new c15t client API when used with
 * the c15t adapter. It's useful for accessing features that are only
 * available in the new API or for gradually migrating components to
 * use the new API directly.
 * 
 * @example
 * ```tsx
 * import { useC15tClient } from '@c15t/react';
 * 
 * function ConsentBanner() {
 *   const client = useC15tClient();
 *   
 *   // If no client is available, fall back to the old API
 *   if (!client) {
 *     const { showPopup, consents, saveConsents } = useConsentManager();
 *     // Use the old API...
 *     return <OldConsentBanner />;
 *   }
 *   
 *   // Use the new c15t client directly
 *   const { isLoading, hasConsented, preferences, acceptAll, declineAll } = client.useConsent();
 *   
 *   // Use the new API...
 *   return <NewConsentBanner />;
 * }
 * ```
 * 
 * @returns The c15t client if available, or null if using the legacy API
 */
export function useC15tClient() {
  // Get the context
  const context = useContext(ConsentStateContext);
  
  if (context === undefined) {
    throw new Error(
      'useC15tClient must be used within a ConsentManagerProvider'
    );
  }
  
  // Check if the store has a c15tClient property (added by the adapter)
  // This is a bit of a hack, but it's the simplest way to detect
  // if we're using the c15t adapter or the legacy store
  if ('c15tClient' in context.store) {
    return (context.store as any).c15tClient;
  }
  
  // If no c15tClient is available, check if the store has getC15tClient
  if ('getC15tClient' in context.store) {
    return (context.store as any).getC15tClient();
  }
  
  // Legacy store, no c15t client available
  return null;
} 