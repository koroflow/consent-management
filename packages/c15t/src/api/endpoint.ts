// api/endpoint.ts
// This file is maintained for backward compatibility
// New code should use the new API based on better-call

import {
	APIError,
	type Endpoint,
	createMiddleware as betterCallCreateMiddleware,
} from 'better-call';
import { createConsentEndpoint } from './call';
import type { EndpointContext, ConsentContext } from '../types';

// Re-export APIError from better-call
export { APIError };

export interface EndpointOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	requiresConsent?: boolean;
	rateLimit?: {
		max: number;
		window: number;
	};
	/**
	 * Middleware to use for this endpoint
	 */
	use?: Array<(context: EndpointContext) => Promise<any>>;
}

// Use the Endpoint type from better-call with our own extension
export type { Endpoint };

/**
 * Creates an API endpoint with proper type checking
 * This is maintained for backward compatibility
 */
export function createEndpoint<
	T extends Record<string, unknown> = Record<string, unknown>,
>(
	handler: (context: EndpointContext) => Promise<Response>,
	options: EndpointOptions = {}
): Endpoint {
	// Path can be derived from the handler name or set to a fallback
	const path = `/${handler.name || 'endpoint'}`;

	// Adapt to the new API
	return createConsentEndpoint(
		path,
		{
			method: (options.method as any) || 'GET',
			requiresConsent: options.requiresConsent,
		},
		async (ctx) => {
			// Adapt context to old format
			const adaptedContext: EndpointContext = {
				...ctx,
				context: ctx.context as any as ConsentContext,
				cookies: {},
				request: ctx.request || new Request('http://localhost'),
				params: ctx.params || {},
				query: ctx.query || {},
				headers: ctx.headers || new Headers(),
				json: <T>(data: T, jsonOptions: { status?: number } = {}) => {
					return new Response(JSON.stringify(data), {
						status: jsonOptions.status || 200,
						headers: {
							'Content-Type': 'application/json',
						},
					});
				},
				setCookie: () => {
					// Not implemented in adapter
				},
				getCookie: () => undefined,
				getSignedCookie: async () => null,
			};

			return await handler(adaptedContext);
		}
	) as Endpoint;
}

/**
 * Creates a response middleware
 * This is maintained for backward compatibility
 */
export function createMiddleware(
	handler: (context: EndpointContext) => Promise<unknown> | unknown
) {
	return betterCallCreateMiddleware(async (ctx) => {
		// Adapt context to old format
		const adaptedContext: EndpointContext = {
			...ctx,
			context: ctx.context as any as ConsentContext,
			cookies: {},
			request: ctx.request || new Request('http://localhost'),
			params: ctx.params || {},
			query: ctx.query || {},
			headers: ctx.headers || new Headers(),
			json: <T>(data: T, jsonOptions: { status?: number } = {}) => {
				return new Response(JSON.stringify(data), {
					status: jsonOptions.status || 200,
					headers: {
						'Content-Type': 'application/json',
					},
				});
			},
			setCookie: () => {
				// Not implemented in adapter
			},
			getCookie: () => undefined,
			getSignedCookie: async () => null,
		};

		return await handler(adaptedContext);
	});
}
