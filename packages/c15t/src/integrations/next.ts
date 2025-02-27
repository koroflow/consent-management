/**
 * Next.js integration for c15t
 * This file provides handlers and utilities for integrating c15t with Next.js
 * without directly importing Next.js types to avoid peer dependencies
 */

import type { C15tInstance } from '~/core';

/**
 * Basic representation of Next.js NextRequest interface without direct dependency
 */
interface GenericNextRequest {
	headers: {
		get: (name: string) => string | null;
		has: (name: string) => boolean;
		[key: string]: any;
	};
	cookies: {
		get: (name: string) => { name: string; value: string } | undefined;
		getAll: () => Array<{ name: string; value: string }>;
		has: (name: string) => boolean;
		[key: string]: any;
	};
	nextUrl?: {
		pathname: string;
		searchParams: URLSearchParams;
		[key: string]: any;
	};
	[key: string]: any;
}

/**
 * Basic representation of Next.js NextResponse interface without direct dependency
 */
interface GenericNextResponse {
	headers: {
		set: (name: string, value: string) => void;
		get: (name: string) => string | null;
		has: (name: string) => boolean;
		delete: (name: string) => void;
		[key: string]: any;
	};
	cookies: {
		set: (name: string, value: string, options?: any) => void;
		get: (name: string) => { name: string; value: string } | undefined;
		delete: (name: string) => void;
		has: (name: string) => boolean;
		[key: string]: any;
	};
	status: (statusCode: number) => GenericNextResponse;
	json: (data: any) => GenericNextResponse;
	[key: string]: any;
}

/**
 * Type for cookie extraction function used in middleware
 */
type CookieExtractor = (
	request: GenericNextRequest,
	cookieName?: string
) => string | null;

/**
 * Context interface for cookie handling in Next.js
 */
interface NextCookieContext {
	setCookie: (name: string, value: string, options?: any) => void;
	getCookie: (name: string) => string | undefined;
	deleteCookie: (name: string) => void;
	response?: Response;
	cookies?: {
		set: (name: string, value: string, options?: any) => void;
		get: (name: string) => { name: string; value: string } | undefined;
		delete: (name: string) => void;
		has: (name: string) => boolean;
	};
}

/**
 * Convert a c15t handler to a Next.js API route handler
 *
 * @param c15t C15t instance
 * @param handlerName Name of the handler to use
 * @returns Next.js API route handler function
 */
export function toNextJsHandler(c15t: C15tInstance, handlerName: string) {
	return async function handler(
		req: Request,
		{ params }: { params?: Record<string, string | string[]> } = {}
	) {
		// Create context object with headers, cookies, etc.
		const headers = new Headers();
		const cookies: NextCookieContext = {
			setCookie: (name, value, options = {}) => {
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
			let body;
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
				json: (data: any, status = 200) => {
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
 * Extract the consent cookie from a Next.js request
 *
 * @param request Next.js request object
 * @param cookieName Name of the consent cookie
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
 * Check if the user has consented based on the cookie
 *
 * @param request Next.js request object
 * @param options Options for the check
 * @returns Whether the user has consented
 */
export const checkConsentCookie = (
	request: GenericNextRequest,
	options: {
		requiredConsent?: string[];
		cookieName?: string;
	} = {}
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
 * A Next.js plugin for handling cookies in server actions
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
