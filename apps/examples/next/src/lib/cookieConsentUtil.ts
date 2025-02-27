import type { NextRequest } from 'next/server';

/**
 * Extract the consent cookie from a Next.js request
 * 
 * @param request Next.js request object
 * @param cookieName Name of the consent cookie
 * @returns The consent cookie value or null if not found
 */
export const getConsentCookie = (
  request: NextRequest, 
  cookieName = 'c15t-consent'
): string | null => {
  // Try the modern cookies API first
  const cookie = request.cookies.get(cookieName);
  if (cookie) {
    return cookie.value;
  }
  
  // Fall back to headers
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  
  // Parse the cookie header
  const cookies = cookieHeader.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});
  
  return cookies[cookieName] || null;
};

/**
 * Check if the user has consented based on the cookie
 * 
 * @param request Next.js request object
 * @param options Options for the check
 * @returns Whether the user has consented
 */
export const checkConsentCookie = (
  request: NextRequest,
  options: {
    requiredConsent?: string[];
    cookieName?: string;
  } = {}
): boolean => {
  const {
    requiredConsent = [],
    cookieName = 'c15t-consent'
  } = options;
  
  // Get the consent cookie
  const consentCookie = getConsentCookie(request, cookieName);
  
  if (!consentCookie) {
    return false;
  }
  
  try {
    // Parse the cookie
    const preferences = JSON.parse(decodeURIComponent(consentCookie));
    
    // If no specific consent is required, just check if consent exists
    if (requiredConsent.length === 0) {
      return true;
    }
    
    // Check if all required consents are given
    return requiredConsent.every(key => preferences[key] === true);
  } catch (e) {
    console.error('Error parsing consent cookie:', e);
    return false;
  }
}; 