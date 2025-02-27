/**
 * Server-side integration for consent management
 * This file provides utilities for working with consent on the server-side
 * without direct dependence on any specific framework
 */

import type { C15tInstance } from '~/core';

/**
 * Generic server header object interface
 * Framework-specific implementations will extend this
 */
interface HeadersObject {
	get: (name: string) => string | null;
	set?: (name: string, value: string) => void;
	append?: (name: string, value: string) => void;
	has?: (name: string) => boolean;
	delete?: (name: string) => void;
	[key: string]: any;
}

/**
 * Options for cookie operations
 */
interface CookieOptions {
	/**
	 * Cookie path
	 * @default '/'
	 */
	path?: string;

	/**
	 * Cookie domain
	 */
	domain?: string;

	/**
	 * Maximum age in seconds
	 */
	maxAge?: number;

	/**
	 * Expiration date
	 */
	expires?: Date;

	/**
	 * Only send cookie over HTTPS
	 * @default true in production
	 */
	secure?: boolean;

	/**
	 * Restrict cookie to HTTP only (no JavaScript access)
	 * @default true
	 */
	httpOnly?: boolean;

	/**
	 * SameSite attribute
	 * @default 'lax'
	 */
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Cookie object interface for server-side consent management
 */
interface CookieObject {
	/**
	 * Get a cookie value
	 */
	get: (name: string) => string | undefined;

	/**
	 * Set a cookie with options
	 */
	set?: (name: string, value: string, options?: CookieOptions) => void;

	/**
	 * Delete a cookie
	 */
	delete?: (name: string, options?: CookieOptions) => void;

	/**
	 * Check if a cookie exists
	 */
	has?: (name: string) => boolean;
}

/**
 * Server context for consent operations
 */
export interface ServerConsentContext {
	/**
	 * Headers object
	 */
	headers?: HeadersObject;

	/**
	 * Cookies object
	 */
	cookies?: CookieObject;

	/**
	 * Optional custom cookie name to use
	 * @default 'c15t-consent'
	 */
	cookieName?: string;
}

/**
 * Get consent information from server context
 *
 * @param c15t C15tInstance to use for consent management
 * @param context Server context with headers and/or cookies
 * @returns Consent status and preferences
 */
export const getServerConsent = (
	c15t: C15tInstance,
	context: ServerConsentContext
) => {
	// Get cookie name from context or use default
	const cookieName = context.cookieName || 'c15t-consent';

	// Try to get the consent cookie from headers or cookies
	let consentCookie: string | undefined | null;

	if (context.cookies?.get) {
		consentCookie = context.cookies.get(cookieName);
	} else if (context.headers?.get) {
		const cookieHeader = context.headers.get('cookie');
		if (cookieHeader) {
			const match = new RegExp(`${cookieName}=([^;]+)`).exec(cookieHeader);
			consentCookie = match ? match[1] : undefined;
		}
	}

	if (!consentCookie) {
		return {
			consented: false,
			preferences: null,
		};
	}

	try {
		// Try to parse the cookie as JSON
		const decoded = decodeURIComponent(consentCookie);
		const parsed = JSON.parse(decoded);

		if (typeof parsed === 'object' && parsed !== null) {
			return {
				consented: true,
				preferences: parsed,
			};
		}
	} catch (e) {
		// If parsing fails, return no consent
		console.error('Failed to parse consent cookie:', e);
	}

	return {
		consented: false,
		preferences: null,
	};
};

/**
 * Set consent information in server context
 *
 * @param c15t C15tInstance to use for consent management
 * @param context Server context with headers and/or cookies
 * @param preferences Consent preferences to set
 * @param options Cookie options
 * @returns Updated consent preferences
 */
export const setServerConsent = (
	c15t: C15tInstance,
	context: ServerConsentContext,
	preferences: Record<string, boolean>,
	options?: CookieOptions
) => {
	// Get cookie name from context or use default
	const cookieName = context.cookieName || 'c15t-consent';

	// Default cookie options
	const cookieOptions: CookieOptions = {
		path: '/',
		httpOnly: false, // Allow JavaScript access
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 365 * 24 * 60 * 60, // 1 year
		...options,
	};

	// Convert preferences to JSON string
	const consentValue = encodeURIComponent(JSON.stringify(preferences));

	// Set the cookie
	if (context.cookies?.set) {
		context.cookies.set(cookieName, consentValue, cookieOptions);
	} else if (context.headers?.set) {
		// Build a cookie string
		let cookieStr = `${cookieName}=${consentValue}`;

		if (cookieOptions.path) cookieStr += `; Path=${cookieOptions.path}`;
		if (cookieOptions.domain) cookieStr += `; Domain=${cookieOptions.domain}`;
		if (cookieOptions.maxAge) cookieStr += `; Max-Age=${cookieOptions.maxAge}`;
		if (cookieOptions.expires)
			cookieStr += `; Expires=${cookieOptions.expires.toUTCString()}`;
		if (cookieOptions.secure) cookieStr += '; Secure';
		if (cookieOptions.httpOnly) cookieStr += '; HttpOnly';
		if (cookieOptions.sameSite)
			cookieStr += `; SameSite=${cookieOptions.sameSite}`;

		context.headers.set('Set-Cookie', cookieStr);
	}

	// Return the preferences
	return {
		consented: true,
		preferences,
	};
};

/**
 * Create a middleware function that checks for consent
 *
 * @param c15t C15tInstance to use for consent management
 * @param options Options for the consent check
 * @returns A middleware function
 */
export const createConsentMiddleware = (
	c15t: C15tInstance,
	options: {
		redirectUrl?: string;
		requiredConsent?: string[];
		cookieName?: string;
	} = {}
) => {
	const {
		redirectUrl = '/consent',
		requiredConsent = [],
		cookieName = 'c15t-consent',
	} = options;

	return (req: any, res: any, next: () => void) => {
		// Create context from request/response objects
		const context: ServerConsentContext = {
			cookieName,
			cookies: {
				get: (name: string) => {
					return req.cookies?.[name];
				},
			},
		};

		// Get consent status
		const { consented, preferences } = getServerConsent(c15t, context);

		// If no consent is required, pass through
		if (requiredConsent.length === 0) {
			next();
			return;
		}

		// Check if all required consents are given
		const hasRequiredConsent =
			consented && requiredConsent.every((key) => preferences?.[key] === true);

		if (hasRequiredConsent) {
			next();
		} else {
			// Redirect to consent page if consent is missing
			const currentUrl = encodeURIComponent(req.url || '/');
			res.redirect(`${redirectUrl}?returnTo=${currentUrl}`);
		}
	};
};
