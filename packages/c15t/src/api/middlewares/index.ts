import { createConsentMiddleware } from '../call';
import type { MiddlewareContext, MiddlewareOptions } from 'better-call';

/**
 * Type extension for the middleware context to include the next function
 * that isn't properly typed in the original definition
 */
interface ExtendedMiddlewareContext extends Omit<MiddlewareContext<MiddlewareOptions>, 'context'> {
	/**
	 * The next function to be called in the middleware chain
	 */
	next: () => Promise<Response | Record<string, unknown>>;
	
	/**
	 * The context object with logger functionality
	 */
	context?: {
		logger?: {
			debug?: (message: string, ...args: unknown[]) => void;
			error?: (message: string, ...args: unknown[]) => void;
		};
	};
}

/**
 * Middleware that adds CORS headers to responses.
 * 
 * This middleware allows cross-origin requests by adding the appropriate
 * CORS headers to all responses. The headers include:
 * - Access-Control-Allow-Origin: *
 * - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
 * - Access-Control-Allow-Headers: Content-Type, Authorization
 * 
 * @example
 * ```typescript
 * // Apply CORS middleware to your API
 * const api = createAPI({
 *   middlewares: [corsMiddleware]
 * });
 * ```
 * 
 * @returns {Response | Record<string, unknown>} The response with CORS headers added
 */
export const corsMiddleware = createConsentMiddleware(
	async (context: MiddlewareContext<MiddlewareOptions>) => {
		// Get next function from the extended context
		const ctx = context as ExtendedMiddlewareContext;
		if (typeof ctx.next !== 'function') {
			// biome-ignore lint/suspicious/noConsole: its okay
			console.warn('Missing next function in middleware context');
			return {};
		}

		// Proceed with the request
		const response = await ctx.next();

		// Add CORS headers to the response
		if (response instanceof Response) {
			response.headers.set('Access-Control-Allow-Origin', '*');
			response.headers.set(
				'Access-Control-Allow-Methods',
				'GET, POST, PUT, DELETE, OPTIONS'
			);
			response.headers.set(
				'Access-Control-Allow-Headers',
				'Content-Type, Authorization'
			);
		}

		return response;
	}
);

/**
 * Middleware that logs API requests and responses for debugging purposes.
 * 
 * This middleware logs the following information:
 * - Request method and URL at the beginning of the request
 * - Response status code and request duration after completion
 * - Error details if the request fails
 * 
 * The logger uses the context's logger object if available, making it compatible
 * with various logging implementations.
 * 
 * @example
 * ```typescript
 * // Apply logger middleware to your API
 * const api = createAPI({
 *   middlewares: [loggerMiddleware]
 * });
 * ```
 * 
 * @returns {Response | Record<string, unknown>} The response from the next middleware
 * @throws {Error} Any error that occurs during request processing
 */
export const loggerMiddleware = createConsentMiddleware(
	async (context: MiddlewareContext<MiddlewareOptions>) => {
		const { method, url } = context.request || {};
		const startTime = Date.now();

		// Get next function from the extended context
		const ctx = context as ExtendedMiddlewareContext;
		if (typeof ctx.next !== 'function') {
			// biome-ignore lint/suspicious/noConsole: its okay
			console.warn('Missing next function in middleware context');
			return {};
		}

		ctx.context?.logger?.debug?.(`API Request: ${method} ${url}`);

		try {
			const response = await ctx.next();
			const duration = Date.now() - startTime;

			let status = 200;
			if (response instanceof Response) {
				status = response.status;
			}

			ctx.context?.logger?.debug?.(`API Response: ${status} (${duration}ms)`);

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			ctx.context?.logger?.error?.(
				`API Error: ${error instanceof Error ? error.message : String(error)} (${duration}ms)`
			);
			throw error;
		}
	}
);

export * from './rate-limiter';
