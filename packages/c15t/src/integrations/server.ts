/**
 * Server-side integration for consent management
 *
 * This module provides utilities for working with consent on the server-side
 * without direct dependence on any specific framework. It includes functions
 * for getting and setting consent cookies, and creating middleware for
 * consent verification.
 *
 * The implementation uses generic interfaces that can be adapted to work with
 * various server frameworks like Express, Fastify, or Koa by mapping their
 * request/response objects to the expected interfaces.
 *
 * @example
 * ```typescript
 * import { getServerConsent, setServerConsent } from '@c15t/integrations/server';
 * import { c15t } from '../lib/c15t';
 *
 * // In a server route handler
 * function handleRequest(req, res) {
 *   // Check if user has consented
 *   const { consented, preferences } = getServerConsent(c15t, {
 *     headers: req.headers,
 *     cookies: req.cookies
 *   });
 *
 *   if (consented) {
 *     // Proceed with the request
 *   } else {
 *     // Ask for consent
 *   }
 * }
 * ```
 */

import type { c15tInstance } from '~/core';

/**
 * Generic server header object interface
 *
 * This interface provides a common abstraction over different server frameworks'
 * header implementations. Framework-specific implementations should map their
 * headers object to match this interface.
 */
interface HeadersObject {
	/**
	 * Get a header value by name
	 * @param name - Header name (case-insensitive)
	 * @returns Header value or null if not found
	 */
	get: (name: string) => string | null;

	/**
	 * Set a header value
	 * @param name - Header name
	 * @param value - Header value
	 */
	set?: (name: string, value: string) => void;

	/**
	 * Append a value to an existing header
	 * @param name - Header name
	 * @param value - Header value to append
	 */
	append?: (name: string, value: string) => void;

	/**
	 * Check if a header exists
	 * @param name - Header name
	 * @returns Whether the header exists
	 */
	has?: (name: string) => boolean;

	/**
	 * Delete a header
	 * @param name - Header name
	 */
	delete?: (name: string) => void;

	/**
	 * Allow additional properties for framework-specific headers
	 */
	[key: string]: unknown;
}

/**
 * Options for cookie operations
 *
 * This interface defines options that can be passed when setting cookies.
 * It follows the standard cookie attributes as defined in RFC 6265.
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
 *
 * This interface provides a common abstraction over different server frameworks'
 * cookie implementations. Framework-specific implementations should map their
 * cookie handling to match this interface.
 */
interface CookieObject {
	/**
	 * Get a cookie value
	 * @param name - Cookie name
	 * @returns Cookie value or undefined if not found
	 */
	get: (name: string) => string | undefined;

	/**
	 * Set a cookie with options
	 * @param name - Cookie name
	 * @param value - Cookie value
	 * @param options - Cookie options
	 */
	set?: (name: string, value: string, options?: CookieOptions) => void;

	/**
	 * Delete a cookie
	 * @param name - Cookie name
	 * @param options - Cookie options (path, domain)
	 */
	delete?: (name: string, options?: CookieOptions) => void;

	/**
	 * Check if a cookie exists
	 * @param name - Cookie name
	 * @returns Whether the cookie exists
	 */
	has?: (name: string) => boolean;
}

/**
 * Basic representation of a server request object
 */
interface ServerRequest {
	/**
	 * URL or path of the request
	 */
	url?: string;

	/**
	 * Request cookies
	 */
	cookies?: Record<string, string>;

	/**
	 * Request headers
	 */
	headers?: HeadersObject;
}

/**
 * Basic representation of a server response object
 */
interface ServerResponse {
	/**
	 * Redirect to a URL
	 * @param url - URL to redirect to
	 */
	redirect: (url: string) => void;
}

/**
 * Server context for consent operations
 *
 * This interface defines the context object that should be passed to
 * server-side consent functions. It includes references to headers
 * and cookies objects from the server framework.
 */
export interface ServerConsentContext {
	/**
	 * Headers object for reading/writing HTTP headers
	 */
	headers?: HeadersObject;

	/**
	 * Cookies object for reading/writing cookies
	 */
	cookies?: CookieObject;

	/**
	 * Optional custom cookie name to use
	 * @default 'c15t-consent'
	 */
	cookieName?: string;
}

/**
 * Result of a consent operation
 */
interface ConsentResult {
	/**
	 * Whether the user has consented
	 */
	consented: boolean;

	/**
	 * Consent preferences, if available
	 */
	preferences: Record<string, boolean> | null;
}

/**
 * Get consent information from server context
 *
 * This function extracts consent information from cookies in the server context.
 * It will attempt to read the consent cookie and parse it as JSON.
 *
 * @example
 * ```typescript
 * // Express.js example
 * app.get('/protected', (req, res) => {
 *   const { consented, preferences } = getServerConsent(c15t, {
 *     headers: req.headers,
 *     cookies: req.cookies
 *   });
 *
 *   if (consented && preferences?.analytics) {
 *     // User has consented to analytics
 *     trackAnalytics(req);
 *   }
 *
 *   // Continue with the request
 *   res.render('protected-page');
 * });
 * ```
 *
 * @param c15t - c15tInstance to use for consent management
 * @param context - Server context with headers and/or cookies
 * @returns Consent status and preferences
 */
export const getServerConsent = (
	_c15t: c15tInstance,
	context: ServerConsentContext
): ConsentResult => {
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
 * This function sets a consent cookie with the provided preferences.
 * It will encode the preferences as JSON and set the appropriate cookie
 * with the provided options.
 *
 * @example
 * ```typescript
 * // Express.js example
 * app.post('/update-consent', (req, res) => {
 *   const preferences = req.body.preferences;
 *
 *   // Set the consent cookie
 *   const result = setServerConsent(c15t, {
 *     cookies: res.cookies
 *   }, preferences);
 *
 *   res.json({ success: true, preferences: result.preferences });
 * });
 * ```
 *
 * @param c15t - c15tInstance to use for consent management
 * @param context - Server context with headers and/or cookies
 * @param preferences - Consent preferences to set
 * @param options - Cookie options
 * @returns Updated consent preferences
 */
export const setServerConsent = (
	c15t: c15tInstance,
	context: ServerConsentContext,
	preferences: Record<string, boolean>,
	options?: CookieOptions
): ConsentResult => {
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

		if (cookieOptions.path) {
			cookieStr += `; Path=${cookieOptions.path}`;
		}
		if (cookieOptions.domain) {
			cookieStr += `; Domain=${cookieOptions.domain}`;
		}
		if (cookieOptions.maxAge) {
			cookieStr += `; Max-Age=${cookieOptions.maxAge}`;
		}
		if (cookieOptions.expires) {
			cookieStr += `; Expires=${cookieOptions.expires.toUTCString()}`;
		}
		if (cookieOptions.secure) {
			cookieStr += '; Secure';
		}
		if (cookieOptions.httpOnly) {
			cookieStr += '; HttpOnly';
		}
		if (cookieOptions.sameSite) {
			cookieStr += `; SameSite=${cookieOptions.sameSite}`;
		}

		context.headers.set('Set-Cookie', cookieStr);
	}

	// Return the preferences
	return {
		consented: true,
		preferences,
	};
};

/**
 * Options for the consent middleware
 */
interface ConsentMiddlewareOptions {
	/**
	 * URL to redirect to if consent is not given
	 * @default '/consent'
	 */
	redirectUrl?: string;

	/**
	 * List of required consent purposes
	 * If any of these are not consented to, redirect to consent page
	 * @default []
	 */
	requiredConsent?: string[];

	/**
	 * Name of the consent cookie
	 * @default 'c15t-consent'
	 */
	cookieName?: string;
}

/**
 * Create a middleware function that checks for consent
 *
 * This function creates a middleware that can be used with various server
 * frameworks to check if a user has consented to specific purposes.
 * If not, the middleware will redirect to a consent page.
 *
 * @example
 * ```typescript
 * // Express.js example
 * import express from 'express';
 * import { createConsentMiddleware } from '@c15t/integrations/server';
 * import { c15t } from '../lib/c15t';
 *
 * const app = express();
 *
 * // Create a middleware that requires analytics consent
 * const consentMiddleware = createConsentMiddleware(c15t, {
 *   redirectUrl: '/consent-page',
 *   requiredConsent: ['analytics']
 * });
 *
 * // Apply the middleware to routes that require consent
 * app.get('/dashboard', consentMiddleware, (req, res) => {
 *   res.render('dashboard');
 * });
 * ```
 *
 * @param c15t - c15tInstance to use for consent management
 * @param options - Options for the consent check
 * @returns A middleware function
 */
export const createConsentMiddleware = (
	c15t: c15tInstance,
	options: ConsentMiddlewareOptions = {}
) => {
	const {
		redirectUrl = '/consent',
		requiredConsent = [],
		cookieName = 'c15t-consent',
	} = options;

	return (req: ServerRequest, res: ServerResponse, next: () => void) => {
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
