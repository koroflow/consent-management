/**
 * Server actions for managing consent
 */
import { headers } from "next/headers";
import { getServerConsent, setServerConsent } from '@c15t/temp/integrations/server';
import { c15tInstance } from '~/lib/c15t';
import { createServerCookieContext } from '~/lib/cookieAdapter';

/**
 * Helper function to create a request object from headers
 */
async function createRequestFromHeaders(): Promise<Request> {
  const headersList = await headers();
  const headersObj = new Headers();
  
  // Copy all headers
  headersList.forEach((value: string, key: string) => {
    headersObj.set(key, value);
  });
  
  // Create a minimal request object with the headers
  return new Request('http://localhost', {
    headers: headersObj
  });
}

/**
 * Accept all cookie preferences
 */
export async function acceptAllCookies() {
  const request = await createRequestFromHeaders();
  const context = createServerCookieContext(request);
  return setServerConsent(
    c15tInstance,
    context,
    {
      analytics: true,
      marketing: true,
      preferences: true
    }
  );
}

/**
 * Reject all cookie preferences
 */
export async function rejectAllCookies() {
  const request = await createRequestFromHeaders();
  const context = createServerCookieContext(request);
  return setServerConsent(
    c15tInstance,
    context,
    {
      analytics: false,
      marketing: false,
      preferences: false
    }
  );
}

/**
 * Set specific cookie preferences
 */
export async function setConsentPreferences(preferences: Record<string, boolean>) {
  const request = await createRequestFromHeaders();
  const context = createServerCookieContext(request);
  return setServerConsent(
    c15tInstance,
    context,
    preferences
  );
}

/**
 * Get current consent status
 */
export async function getConsentStatus() {
  const request = await createRequestFromHeaders();
  const context = createServerCookieContext(request);
  return getServerConsent(
    c15tInstance,
    context
  );
} 