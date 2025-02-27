/**
 * Next.js integration for c15t
 *
 * This module provides handlers and utilities for integrating the c15t consent management
 * system with Next.js applications. It includes adapters for Next.js App Router API routes
 * and a plugin for cookie management.
 */

import type { CookieOptions } from '~/cookies';
import type { C15TInstance } from '~/core';

/**
 * Convert a c15t handler to a Next.js API route handler.
 *
 * This function adapts a c15t handler to work with Next.js App Router API routes,
 * providing GET and POST handler functions.
 *
 * @example
 * ```typescript
 * // app/api/c15t/route.ts
 * import { toNextJsHandler } from '@c15t/integrations/next';
 * import { c15t } from '@/lib/c15t';
 *
 * export const { GET, POST } = toNextJsHandler(c15t);
 * ```
 *
 * @param c15t - c15t instance containing the handler or a handler function
 * @returns Next.js API route handler functions for GET and POST
 */
export function toNextJsHandler(
	c15t: C15TInstance | ((request: Request) => Promise<Response>)
) {
	const handler = async (request: Request) => {
		console.log('DEBUG next.ts handler - Request URL:', request.url);
		console.log(
			'DEBUG next.ts handler - Request headers:',
			JSON.stringify(
				Object.fromEntries([...request.headers.entries()]),
				null,
				2
			)
		);

		try {
			// Check if c15t is properly configured
			if ('handler' in c15t) {
				console.log('DEBUG next.ts handler - Using c15t instance handler');

				// Ensure the baseURL is set correctly for the c15t instance
				if ('$context' in c15t && c15t.$context) {
					const contextPromise = c15t.$context;
					try {
						const context = await contextPromise;

						// If baseURL is not set, initialize it from the request URL
						if (!context.baseURL || context.baseURL.trim() === '') {
							const url = new URL(request.url);
							const basePath = context.options?.basePath || '/api/c15t';
							const baseURL = `${url.origin}${basePath}`;

							console.log(
								'DEBUG next.ts handler - Setting missing baseURL:',
								baseURL
							);
							context.baseURL = baseURL;
							if (context.options) {
								context.options.baseURL = baseURL;
							}
						}

						console.log(
							'DEBUG next.ts handler - c15t context baseURL:',
							context.baseURL
						);
						console.log(
							'DEBUG next.ts handler - c15t options:',
							JSON.stringify(
								{
									baseURL: context.options?.baseURL,
									basePath: context.options?.basePath,
								},
								null,
								2
							)
						);
					} catch (e) {
						console.error(
							'DEBUG next.ts handler - Error accessing c15t context:',
							e
						);
					}
				}

				return c15t.handler(request);
			} else {
				console.log('DEBUG next.ts handler - Using function handler');
				return c15t(request);
			}
		} catch (error) {
			console.error('DEBUG next.ts handler - Error in handler:', error);
			throw error;
		}
	};

	return {
		GET: handler,
		POST: handler,
	};
}

/**
 * Cookie property interface for parsed cookie values
 */
interface CookieProperties {
	value: string;
	domain?: string;
	path?: string;
	'max-age'?: number;
	expires?: string;
	secure?: boolean;
	httponly?: boolean;
	samesite?: 'strict' | 'lax' | 'none';
	[key: string]: unknown;
}

/**
 * Parse a Set-Cookie header into a Map of cookie name to cookie properties
 *
 * @param setCookieHeader - The Set-Cookie header value
 * @returns A Map of cookie name to cookie properties
 */
function parseSetCookieHeader(
	setCookieHeader: string
): Map<string, CookieProperties> {
	const cookies = new Map<string, CookieProperties>();

	// Split multiple cookies (they might be separated by newlines)
	const cookieStrings = setCookieHeader.split(/\r?\n/);

	for (const cookieStr of cookieStrings) {
		// Split the first part which is name=value from the rest
		const parts = cookieStr.split(';');
		const nameValuePair = parts.shift();
		if (!nameValuePair) {
			continue;
		}

		const nameValue = nameValuePair.split('=');
		if (nameValue.length < 2) {
			continue;
		}

		const name = nameValue[0]?.trim();
		if (!name) {
			continue;
		}

		// Join back in case the value itself contains '='
		const value = nameValue.slice(1).join('=');

		const cookie: CookieProperties = { value };

		// Parse other cookie attributes
		for (const part of parts) {
			const [attrName, ...attrValueParts] = part.trim().split('=');
			if (!attrName) {
				continue;
			}

			const lowerAttrName = attrName.toLowerCase();

			if (attrValueParts.length > 0) {
				const attrValue = attrValueParts.join('=');
				if (lowerAttrName === 'max-age') {
					cookie[lowerAttrName] = Number.parseInt(attrValue, 10);
				} else {
					cookie[lowerAttrName] = attrValue;
				}
			} else {
				// Boolean attributes like 'Secure' and 'HttpOnly'
				cookie[lowerAttrName] = true;
			}
		}

		cookies.set(name, cookie);
	}

	return cookies;
}

/**
 * Context interface for the plugin handler
 */
interface PluginContext {
	_flag?: string;
	response?: Response;
	responseHeader?: Headers;
	[key: string]: unknown;
}

/**
 * A Next.js plugin for handling cookies in server components and actions.
 *
 * This plugin integrates c15t with Next.js cookie handling, automatically
 * transferring cookies set in c15t responses to the Next.js cookie store.
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
 * @returns A plugin configuration object for c15t
 */
export function nextCookies() {
	return {
		name: 'next-cookies',
		hooks: {
			afterResponse: [
				{
					matcher: () => true,
					handler: async (ctx: PluginContext) => {
						if (ctx._flag === 'router') {
							return;
						}

						const responseHeader = ctx.response?.headers || ctx.responseHeader;
						if (!responseHeader || !responseHeader.has('Set-Cookie')) {
							return;
						}

						try {
							const setCookieHeader = responseHeader.get('Set-Cookie');
							if (!setCookieHeader) return;

							// Import Next.js cookies API dynamically
							//@ts-expect-error
							const { cookies } = await import('next/headers');
							type CookieStore = {
								set: (
									name: string,
									value: string,
									options?: CookieOptions
								) => void;
							};
							const cookieStore = cookies() as CookieStore;
							// Parse and set cookies
							const parsedCookies = parseSetCookieHeader(setCookieHeader);
							parsedCookies.forEach((value, key) => {
								if (!key) {
									return;
								}

								const opts = {
									sameSite: value.samesite as
										| 'strict'
										| 'lax'
										| 'none'
										| undefined,
									secure: value.secure,
									maxAge: value['max-age'],
									httpOnly: value.httponly,
									domain: value.domain,
									path: value.path,
								} as const;

								try {
									cookieStore.set(key, decodeURIComponent(value.value), opts);
								} catch (e) {
									// This will fail if called in a server component
									// biome-ignore lint/suspicious/noConsole: <explanation>
									console.debug('Failed to set cookie with Next.js API:', e);
								}
							});
						} catch (e) {
							// Ignore errors when cookies API is not available
							// biome-ignore lint/suspicious/noConsole: <explanation>
							console.debug('Next.js cookies API not available:', e);
						}
					},
				},
			],
		},
	};
}

/**
 * Extract the consent cookie from a Next.js request.
 *
 * @param request - Next.js request object
 * @param cookieName - Name of the consent cookie (defaults to 'c15t-consent')
 * @returns The consent cookie value or null if not found
 */
export const getConsentCookie = (
	request: Request,
	cookieName = 'c15t-consent'
): string | null => {
	const cookieHeader = request.headers.get('cookie');
	if (!cookieHeader) {
		return null;
	}

	// Parse the cookie header
	const cookies = cookieHeader
		.split(';')
		.reduce<Record<string, string>>((acc, cookie) => {
			const [key, value] = cookie.trim().split('=');
			if (key && value) {
				acc[key] = value;
			}
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
 * @param request - Next.js request object
 * @param options - Options for the check including required consent purposes
 * @returns Whether the user has consented to all required purposes
 */
export const checkConsentCookie = (
	request: Request,
	options: CheckConsentOptions = {}
): boolean => {
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
		// biome-ignore lint/suspicious/noConsole: <explanation>
		console.error('Error parsing consent cookie:', e);
		return false;
	}
};
