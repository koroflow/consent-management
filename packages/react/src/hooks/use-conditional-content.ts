import { useConsentManager } from './use-consent-manager';
import { useC15tClient } from './use-c15t-client';

/**
 * Hook for conditionally rendering content based on consent.
 * 
 * This hook checks if the user has consented to specific purposes
 * and returns a boolean indicating whether the content can be shown.
 * It works with both the new c15t client and the legacy API.
 * 
 * @example
 * ```tsx
 * import { useConditionalContent } from '@c15t/react';
 * 
 * function AnalyticsComponent() {
 *   const { canShow, isLoading } = useConditionalContent('analytics');
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!canShow) return null;
 *   
 *   return <div>Analytics content is shown because you consented!</div>;
 * }
 * ```
 * 
 * @param requiredConsent - Required consent purpose(s) to show content
 * @returns Object with loading state, consent status, and whether content can be shown
 */
export function useConditionalContent(requiredConsent: string | string[]) {
  // Try to use the new c15t client if available
  const client = useC15tClient();
  
  if (client) {
    // Use the new API directly
    return client.useConditionalContent(requiredConsent);
  }
  
  // Fall back to the legacy API
  const { isLoadingConsentInfo, consents, hasConsented: hasConsentedFn } = useConsentManager();
  
  const canShow = () => {
    // If still loading or no consent given, don't show
    if (isLoadingConsentInfo || !hasConsentedFn()) {
      return false;
    }
    
    // Check if all required consents are given
    if (Array.isArray(requiredConsent)) {
      return requiredConsent.every(purpose => consents[purpose]);
    }
    
    // Check if the single required consent is given
    return !!consents[requiredConsent];
  };
  
  return {
    isLoading: isLoadingConsentInfo,
    hasConsented: hasConsentedFn(),
    canShow: canShow(),
    preferences: consents,
  };
} 