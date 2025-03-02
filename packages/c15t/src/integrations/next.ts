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
		// Check if c15t is properly configured
		if ('handler' in c15t) {
			// Ensure the baseURL is set correctly for the c15t instance
			if ('$context' in c15t && c15t.$context) {
				const contextPromise = c15t.$context;
				const context = await contextPromise;

				// If baseURL is not set, initialize it from the request URL
				if (!context.baseURL || context.baseURL.trim() === '') {
					const url = new URL(request.url);
					const basePath = context.options?.basePath || '/api/c15t';
					const baseURL = `${url.origin}${basePath}`;

					context.baseURL = baseURL;
					if (context.options) {
						context.options.baseURL = baseURL;
					}
				}
			}

			return c15t.handler(request);
		}
		return c15t(request);
	};

	return {
		GET: handler,
		POST: handler,
	};
}
