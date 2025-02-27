
import { } from 'next/server';

/**
 * Type for cookie options 
 */
interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Interface for the cookie object that c15t expects
 */
export interface CookieObject {
  get: (name: string) => string | undefined;
  set?: (name: string, value: string, options?: CookieOptions) => void;
  delete?: (name: string, options?: CookieOptions) => void;
  has?: (name: string) => boolean;
}

/**
 * Parse cookies from a cookie header string
 * @param cookieHeader Cookie header string
 * @returns Map of cookie name to cookie value
 */
function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies.set(name.trim(), value.trim());
    }
  });
  
  return cookies;
}

/**
 * Creates a synchronous cookie adapter for server components
 * This uses direct request header parsing rather than the async cookies() API
 */
export function createSyncCookieAdapter(request?: Request): CookieObject {
  // Get the cookie header directly from the request
  const cookieHeader = request?.headers.get('cookie') || '';
  const cookieMap = parseCookieHeader(cookieHeader);
  
  let response: Response | undefined ;
  
  return {
    get: (name: string) => {
      return cookieMap.get(name);
    },
    set: (name: string, value: string, options?: CookieOptions) => {
      // Create cookie string
      let cookieStr = `${name}=${value}`;
      
      if (options?.path) cookieStr += `; Path=${options.path}`;
      if (options?.domain) cookieStr += `; Domain=${options.domain}`;
      if (options?.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
      if (options?.expires) cookieStr += `; Expires=${options.expires.toUTCString()}`;
      if (options?.secure) cookieStr += '; Secure';
      if (options?.httpOnly) cookieStr += '; HttpOnly';
      if (options?.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
      
      // In-memory update
      cookieMap.set(name, value);
      
      // We need to store the cookie to be set later if outside middleware
      if (!response) {
        response = new Response(null);
      }
      
      const existingCookies = response.headers.get('Set-Cookie') || '';
      if (existingCookies) {
        response.headers.set('Set-Cookie', `${existingCookies}, ${cookieStr}`);
      } else {
        response.headers.set('Set-Cookie', cookieStr);
      }
    },
    delete: (name: string) => {
      cookieMap.delete(name);
      
      // Also set an expired cookie
      if (!response) {
        response = new Response(null);
      }
      
      const expiredCookie = `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      const existingCookies = response.headers.get('Set-Cookie') || '';
      
      if (existingCookies) {
        response.headers.set('Set-Cookie', `${existingCookies}, ${expiredCookie}`);
      } else {
        response.headers.set('Set-Cookie', expiredCookie);
      }
    },
    has: (name: string) => {
      return cookieMap.has(name);
    }
  };
}

/**
 * Helper function to create a cookie context for server actions
 * This uses headers from the request
 */
export function createServerCookieContext(request?: Request) {
  return {
    cookies: createSyncCookieAdapter(request)
  };
} 