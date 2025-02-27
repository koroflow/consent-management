import { createConsentMiddleware } from '../call';
import type { MiddlewareContext, MiddlewareOptions } from 'better-call';

/**
 * Middleware that adds CORS headers to responses
 */
export const corsMiddleware = createConsentMiddleware(
	async (context: MiddlewareContext<MiddlewareOptions>) => {
		// Get next function (needs type casting as it's not in the type definition)
		const next = (context as any).next;
		if (typeof next !== 'function') {
			console.warn('Missing next function in middleware context');
			return {};
		}

		// Proceed with the request
		const response = await next();

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
 * Middleware that logs requests for debugging
 */
export const loggerMiddleware = createConsentMiddleware(
	async (context: MiddlewareContext<MiddlewareOptions>) => {
		const { method, url } = context.request || {};
		const startTime = Date.now();

		// Get next function (needs type casting as it's not in the type definition)
		const next = (context as any).next;
		if (typeof next !== 'function') {
			console.warn('Missing next function in middleware context');
			return {};
		}

		const ctx = context as any;
		ctx.context?.logger?.debug?.(`API Request: ${method} ${url}`);

		try {
			const response = await next();
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
