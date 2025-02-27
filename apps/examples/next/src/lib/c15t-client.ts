import { createConsentClient } from '@c15t/new/integrations/react';

/**
 * Create a client for React components to use
 */
export const {
  useConsent,
  useConditionalContent
} = createConsentClient({
  baseUrl: '/api/c15t',
  defaultPreferences: {
    analytics: true,
    marketing: true,
    preferences: true
  }
}); 