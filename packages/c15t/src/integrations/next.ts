/**
 * Next.js integration for c15t
 *
 * This module provides handlers and utilities for integrating the c15t consent management
 * system with Next.js applications. It includes adapters for handling API routes,
 * middleware for cookie management, and utilities for consent verification.
 *
 * The implementation avoids direct dependencies on Next.js types to prevent requiring
 * Next.js as a peer dependency, making it more flexible for different Next.js versions.
 *
 * @example
 * ```typescript
 * import { toNextJsHandler } from '@c15t/integrations/next';
 * import { c15t } from '../lib/c15t';
 *
 * // Create a Next.js API route handler
 * export default toNextJsHandler(c15t, 'getConsent');
 * ```
 */

import type { c15tInstance } from '~/core';

/**
 * Cookie options interface for standardizing cookie parameters
 */
interface CookieOptions {
	/** Path where the cookie is available */
	path?: string;
	/** Domain where the cookie is available */
	domain?: string;
	/** Maximum age of the cookie in seconds */
	maxAge?: number;
	/** Date when the cookie expires */
	expires?: string | Date;
	/** Whether the cookie is only accessible via HTTP(S) requests */
	httpOnly?: boolean;
	/** Whether the cookie should only be sent over HTTPS */
	secure?: boolean;
	/** Controls whether the cookie is sent with cross-site requests */
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Basic representation of Next.js NextRequest interface without direct dependency.
 *
 * This interface models the essential properties of a Next.js request object
 * to allow for type checking without importing from Next.js directly.
 */
interface GenericNextRequest {
	headers: {
		get: (name: string) => string | null;
		has: (name: string) => boolean;
		[key: string]: unknown;
	};
	cookies: {
		get: (name: string) => { name: string; value: string } | undefined;
		getAll: () => Array<{ name: string; value: string }>;
		has: (name: string) => boolean;
		[key: string]: unknown;
	};
	nextUrl?: {
		pathname: string;
		searchParams: URLSearchParams;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/**
 * Type for cookie extraction function used in middleware.
 *
 * This function extracts a cookie value from a Next.js request object.
 */
type CookieExtractor = (
	request: GenericNextRequest,
	cookieName?: string
) => string | null;

/**
 * Context interface for cookie handling in Next.js.
 *
 * This interface provides a standardized way to interact with cookies
 * across different Next.js API contexts.
 */
interface NextCookieContext {
	/**
	 * Sets a cookie in the response
	 *
	 * @param name - Cookie name
	 * @param value - Cookie value
	 * @param options - Cookie options (path, expires, etc.)
	 */
	setCookie: (name: string, value: string, options?: CookieOptions) => void;

	/**
	 * Gets a cookie value from the request
	 *
	 * @param name - Cookie name
	 * @returns The cookie value or undefined if not found
	 */
	getCookie: (name: string) => string | undefined;

	/**
	 * Deletes a cookie by setting its expiration to the past
	 *
	 * @param name - Cookie name to delete
	 */
	deleteCookie: (name: string) => void;

	/**
	 * Response object if available
	 */
	response?: Response;

	/**
	 * Next.js cookies API if available
	 */
	cookies?: {
		set: (name: string, value: string, options?: CookieOptions) => void;
		get: (name: string) => { name: string; value: string } | undefined;
		delete: (name: string) => void;
		has: (name: string) => boolean;
	};
}

/**
 * JSON-serializable data types that can be used in API responses
 */
type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

/**
 * Convert a c15t handler to a Next.js API route handler.
 *
 * This function adapts a c15t handler to work as a Next.js API route handler,
 * handling the request/response conversion between the two systems.
 *
 * @example
 * ```typescript
 * // pages/api/consent.ts
 * import { toNextJsHandler } from '@c15t/integrations/next';
 * import { c15t } from '../../lib/c15t';
 *
 * export default toNextJsHandler(c15t, 'getConsent');
 * ```
 *
 * @param c15t - c15t instance containing the handler
 * @param handlerName - Name of the handler to use from the c15t instance
 * @returns Next.js API route handler function
 */
export function toNextJsHandler(c15t: c15tInstance, handlerName: string) {
	return async function handler(
		req: Request,
		{ params }: { params?: Record<string, string | string[]> } = {}
	) {
		// Create context object with headers, cookies, etc.
		const headers = new Headers();
		const cookies: NextCookieContext = {
			setCookie: (name, value, options: CookieOptions = {}) => {
				// Convert options to cookie string parts
				const parts: string[] = [`${name}=${value}`];

				if (options.path) parts.push(`Path=${options.path}`);
				if (options.domain) parts.push(`Domain=${options.domain}`);
				if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
				if (options.expires) parts.push(`Expires=${options.expires}`);
				if (options.httpOnly) parts.push('HttpOnly');
				if (options.secure) parts.push('Secure');
				if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);

				headers.append('Set-Cookie', parts.join('; '));
			},
			getCookie: (name) => {
				const cookieHeader = req.headers.get('cookie');
				if (!cookieHeader) return undefined;

				const match = new RegExp(`${name}=([^;]+)`).exec(cookieHeader);
				return match ? match[1] : undefined;
			},
			deleteCookie: (name) => {
				headers.append('Set-Cookie', `${name}=; Path=/; Max-Age=0`);
			},
		};

		try {
			// Parse request
			const url = new URL(req.url);
			const query = Object.fromEntries(url.searchParams.entries());
			const method = req.method;

			// Parse body if available
			let body: Record<string, unknown> | undefined;
			try {
				if (['POST', 'PUT', 'PATCH'].includes(method)) {
					const contentType = req.headers.get('content-type') || '';
					if (contentType.includes('application/json')) {
						body = await req.json();
					} else if (
						contentType.includes('application/x-www-form-urlencoded')
					) {
						const formData = await req.formData();
						body = Object.fromEntries(formData.entries());
					}
				}
			} catch (e) {
				// Ignore body parsing errors
				console.error('Error parsing request body:', e);
			}

			// Create endpoint context
			const endpointContext = {
				context: { cookies },
				request: req,
				body,
				params: params || {},
				query,
				headers: req.headers,
				cookies,
				json: (data: JsonValue, status = 200) => {
					return new Response(JSON.stringify(data), {
						status,
						headers: {
							'Content-Type': 'application/json',
							...Object.fromEntries(headers.entries()),
						},
					});
				},
				setCookie: cookies.setCookie,
				getCookie: cookies.getCookie,
				getSignedCookie: (name: string) => cookies.getCookie(name),
			};

			// Call the appropriate handler
			// @ts-ignore - Dynamic handler access
			const result = await c15t[handlerName](endpointContext);

			if (result instanceof Response) {
				// If the handler returned a Response directly, use it
				// But ensure we include our headers (e.g., Set-Cookie)
				const origHeaders = Object.fromEntries(result.headers.entries());
				const combinedHeaders = { ...origHeaders };

				headers.forEach((value, key) => {
					if (key.toLowerCase() === 'set-cookie') {
						// Append rather than replace Set-Cookie headers
						if (combinedHeaders[key]) {
							// For Set-Cookie, we need to keep it as a string
							// Multiple cookies should be separated by a newline
							combinedHeaders[key] = `${combinedHeaders[key]}\n${value}`;
						} else {
							combinedHeaders[key] = value;
						}
					} else {
						combinedHeaders[key] = value;
					}
				});

				return new Response(result.body, {
					status: result.status,
					statusText: result.statusText,
					headers: combinedHeaders,
				});
			}

			// If a plain object was returned, convert to JSON response
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					...Object.fromEntries(headers.entries()),
				},
			});
		} catch (error) {
			console.error('Error in Next.js API route handler:', error);

			return new Response(
				JSON.stringify({
					error: error instanceof Error ? error.message : 'Unknown error',
					status: 'error',
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
						...Object.fromEntries(headers.entries()),
					},
				}
			);
		}
	};
}

/**
 * Extract the consent cookie from a Next.js request.
 *
 * This function retrieves the consent cookie value from either the cookies API
 * or the cookie header, depending on what's available in the request.
 *
 * @example
 * ```typescript
 * // In a middleware or API route
 * import { getConsentCookie } from '@c15t/integrations/next';
 *
 * export default function middleware(request) {
 *   const consentValue = getConsentCookie(request);
 *   // Use the consent value to make decisions
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param cookieName - Name of the consent cookie (defaults to 'c15t-consent')
 * @returns The consent cookie value or null if not found
 */
export const getConsentCookie: CookieExtractor = (
	request: GenericNextRequest,
	cookieName = 'c15t-consent'
) => {
	// Try the modern cookies API first
	if (request.cookies?.get) {
		const cookie = request.cookies.get(cookieName);
		if (cookie) return cookie.value;
	}

	// Fall back to headers
	const cookieHeader = request.headers.get('cookie');
	if (!cookieHeader) return null;

	// Parse the cookie header
	const cookies = cookieHeader
		.split(';')
		.reduce<Record<string, string>>((acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			if (key && value) acc[key] = value;
			return acc;
		}, {});

	return cookies[cookieName] || null;
};

/**
 * Interface for options passed to the checkConsentCookie function
 */
interface CheckConsentOptions {
	/**
	 * List of consent purpose IDs that are required for the operation
	 */
	requiredConsent?: string[];

	/**
	 * The name of the cookie containing consent information
	 * @default 'c15t-consent'
	 */
	cookieName?: string;
}

/**
 * Check if the user has provided consent based on the cookie.
 *
 * This function verifies whether the user has consented to specific purposes
 * by checking the consent cookie. If no specific consent purposes are required,
 * it simply checks if the consent cookie exists.
 *
 * @example
 * ```typescript
 * // In a middleware or API route
 * import { checkConsentCookie } from '@c15t/integrations/next';
 *
 * export default function middleware(request) {
 *   const hasConsent = checkConsentCookie(request, {
 *     requiredConsent: ['analytics', 'marketing']
 *   });
 *
 *   if (!hasConsent) {
 *     // Redirect to consent page or show consent banner
 *   }
 * }
 * ```
 *
 * @param request - Next.js request object
 * @param options - Options for the check including required consent purposes
 * @returns Whether the user has consented to all required purposes
 */
export const checkConsentCookie = (
	request: GenericNextRequest,
	options: CheckConsentOptions = {}
) => {
	const { requiredConsent = [], cookieName = 'c15t-consent' } = options;

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
		return requiredConsent.every((key) => preferences[key] === true);
	} catch (e) {
		console.error('Error parsing consent cookie:', e);
		return false;
	}
};

/**
 * A Next.js plugin for handling cookies in server actions.
 *
 * This plugin provides hooks for managing cookies in Next.js server actions,
 * allowing for seamless integration between c15t and Next.js cookie handling.
 *
 * @example
 * ```typescript
 * // In your c15t configuration
 * import { nextCookies } from '@c15t/integrations/next';
 *
 * const c15t = createc15t({
 *   plugins: [nextCookies()],
 *   // other options
 * });
 * ```
 *
 * @returns A plugin configuration object compatible with the c15t plugin system
 */
export function nextCookies() {
	return {
		name: 'next-cookies',
		hooks: {
			afterResponse: [
				{
					matcher: () => true,
					handler: async (ctx: NextCookieContext) => {
						// Extract Set-Cookie header and set it using Next.js cookies API
						if (
							ctx.response instanceof Response &&
							ctx.response.headers.has('Set-Cookie')
						) {
							const cookieHeader = ctx.response.headers.get('Set-Cookie');

							// If we're in a Server Action context and have access to cookies API
							if (typeof ctx.cookies?.set === 'function') {
								// Parse cookie header and set it
								const cookieMatch = /^([^=]+)=([^;]+);.+/.exec(
									cookieHeader || ''
								);
								if (cookieMatch) {
									const [, name, value] = cookieMatch;
									if (name && value) {
										ctx.cookies.set(name, value);
									}
								}
							}
						}
					},
				},
			],
		},
	};
}
