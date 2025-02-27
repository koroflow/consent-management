import type { Endpoint } from 'better-call';
import type { ConsentContext } from '../types';
import type { c15tOptions, LoggerMetadata } from '../types/options';
import { routes as baseRoutes } from './routes';
import { loggerMiddleware, corsMiddleware } from './middlewares';
import { APIError } from 'better-call';

/**
 * Aggregates and returns all endpoints from base routes and plugins.
 * 
 * This function combines the core consent management endpoints with any
 * additional endpoints provided by plugins. It serves as the central point
 * for building the complete API surface of the c15t system.
 * 
 * @example
 * ```typescript
 * import { getEndpoints } from '@c15t/api';
 * 
 * // Get all available endpoints
 * const { endpoints } = getEndpoints(context, {
 *   plugins: [myCustomPlugin]
 * });
 * 
 * // Use endpoints in your application
 * const api = createAPI({ endpoints });
 * ```
 * 
 * @param context - The consent context object containing application state and helpers
 * @param options - Configuration options including plugins
 * @returns Object containing all available endpoints
 */
export function getEndpoints(context: ConsentContext, options: c15tOptions) {
	// Collect endpoints from plugins
	const pluginEndpoints: Record<string, Endpoint> = {};

	// Add plugin endpoints if available
	if (options.plugins && options.plugins.length > 0) {
		for (const plugin of options.plugins) {
			if (plugin.endpoints) {
				// Add each endpoint to the collection
				for (const key of Object.keys(plugin.endpoints)) {
					const endpoint = plugin.endpoints[key];
					if (endpoint) {
						pluginEndpoints[key] = endpoint;
					}
				}
			}
		}
	}

	// Create combined API
	const endpoints = {
		...baseRoutes,
		...pluginEndpoints,
	};

	return {
		endpoints,
	};
}

/**
 * Creates a router that handles API requests for the consent management system.
 * 
 * This function sets up a complete request handler that can process API requests
 * for consent management. It configures:
 * - Base URL path for the API
 * - CORS handling (enabled by default)
 * - Logging middleware
 * - Error handling
 * 
 * The returned object provides various ways to use the router:
 * - `api` and `endpoints`: Access to all endpoints for programmatic use
 * - `handler`: Fetch API compatible request handler
 * - `nodeHandler`: Node.js compatible request handler
 * - `routerConfig`: Configuration details for the router
 * 
 * @example
 * ```typescript
 * import { router } from '@c15t/api';
 * 
 * // Create an API router
 * const api = router(context, {
 *   basePath: '/api/v1/consent',
 *   cors: true
 * });
 * 
 * // Use with fetch API
 * addEventListener('fetch', (event) => {
 *   event.respondWith(api.handler(event.request));
 * });
 * 
 * // Or use with Node.js
 * app.use('/api/consent', (req, res) => api.nodeHandler(req, res));
 * ```
 * 
 * @param context - The consent context object containing application state and helpers
 * @param options - Configuration options for the router
 * @returns Object containing handler functions and endpoints
 */
export function router(context: ConsentContext, options: c15tOptions) {
	const { endpoints } = getEndpoints(context, options);

	// Configure basePath for the API
	const basePath = options.basePath || '/api/consent';

	// Create router configuration with endpoints
	const routerConfig = {
		baseURL: basePath,
		cors: options.cors !== false,
		middlewares: [
			loggerMiddleware,
			...(options.cors !== false ? [corsMiddleware] : []),
		],
		onError: (error: Error) => {
			context.logger.error('API Error:', error as unknown as LoggerMetadata);

			if (error instanceof APIError) {
				return {
					status: typeof error.status === 'string' ? 500 : error.status || 500,
					body: {
						error: error.message,
						message: error.message,
						details: error.cause || {},
					},
				};
			}

			return {
				status: 500,
				body: {
					error: 'internal_server_error',
					message: 'An unexpected error occurred',
					details: error instanceof Error ? error.message : String(error),
				},
			};
		},
	};

	// Create the router with our endpoints
	const apiRouter = {
		...endpoints,
		config: routerConfig,
	};

	/**
	 * Fetch API compatible request handler for the consent API.
	 * 
	 * @param request - Fetch API Request object
	 * @returns Response object for the API request
	 */
	const handler = async (request: Request) => {
		try {
			// Parse URL and extract path
			const url = new URL(request.url);
			const path = url.pathname.replace(basePath, '');

			// Find matching endpoint
			const endpointKey = Object.keys(endpoints).find((key) => {
				const endpoint = endpoints[key];
				// Check if path matches, don't check method as it might not exist on the endpoint
				return endpoint?.path === path;
			});

			if (!endpointKey) {
				throw new APIError('BAD_REQUEST', {
					message: 'Endpoint not found',
					status: 404,
				});
			}

			const endpoint = endpoints[endpointKey];
			if (!endpoint) {
				throw new APIError('BAD_REQUEST', {
					message: 'Endpoint not found',
					status: 404,
				});
			}

			// Call endpoint with request
			const result = await endpoint({
				request,
				context,
				options,
				// Additional context will be provided by middleware
			});

			return result instanceof Response
				? result
				: new Response(JSON.stringify(result), {
						status: 200,
						headers: {
							'Content-Type': 'application/json',
						},
					});
		} catch (error) {
			// Handle errors
			context.logger.error('API error:', error as LoggerMetadata);

			if (error instanceof APIError) {
				return new Response(
					JSON.stringify({
						error: error.message,
						message: error.message,
						details: error.cause || {},
					}),
					{
						status:
							typeof error.status === 'string' ? 500 : error.status || 500,
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
			}

			return new Response(
				JSON.stringify({
					error: 'internal_server_error',
					message: 'An unexpected error occurred',
					details: error instanceof Error ? error.message : String(error),
				}),
				{
					status: 500,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}
	};

	/**
	 * Node.js compatible request handler for the consent API.
	 * 
	 * @param req - Node.js HTTP request object
	 * @param res - Node.js HTTP response object
	 * @returns Promise that resolves when the response is sent
	 */
	const nodeHandler = (
		req: { url?: string; method?: string; headers: Record<string, string | string[] | undefined> },
		res: { statusCode: number; setHeader: (key: string, value: string) => void; write: (chunk: string) => void; end: () => void }
	) => {
		// Convert Node.js request to fetch Request
		const url = new URL(
			req.url || '',
			`http://${req.headers.host || 'localhost'}`
		);
		const request = new Request(url.toString(), {
			method: req.method,
			headers: new Headers(req.headers as Record<string, string>),
			body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req) : undefined,
		});

		// Call our handler with the Request
		return handler(request)
			.then((response) => {
				// Set status code
				res.statusCode = response.status;

				// Set headers
				response.headers.forEach((value, key) => {
					res.setHeader(key, value);
				});

				// Stream body to response
				response.body?.pipeTo(
					new WritableStream({
						write(chunk) {
							res.write(new TextDecoder().decode(chunk));
						},
						close() {
							res.end();
						},
						abort(err) {
							// biome-ignore lint/suspicious/noConsole: <explanation>
							console.error('Error streaming response:', err);
							res.end();
						},
					})
				);
			})
			.catch((err) => {
				// biome-ignore lint/suspicious/noConsole: <explanation>
				console.error('Handler error:', err);
				res.statusCode = 500;
				res.setHeader('Content-Type', 'application/json');
				res.end(
          // @ts-expect-error
					JSON.stringify({
						error: 'internal_server_error',
						message: 'An unexpected error occurred in the handler',
					})
				);
			});
	};

	return {
		api: endpoints,
		endpoints,
		handler,
		nodeHandler,
		routerConfig,
	};
}

export * from './call';
export * from './routes';
export * from './middlewares';
