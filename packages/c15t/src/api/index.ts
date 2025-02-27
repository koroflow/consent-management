// api/index.ts
import type { Endpoint } from 'better-call';
import type { ConsentContext } from '../types';
import type { C15tOptions } from '../types/options';
import { routes as baseRoutes } from './routes';
import { loggerMiddleware, corsMiddleware } from './middlewares';
import { APIError } from 'better-call';

/**
 * Get combined endpoints from base routes and plugins
 */
export function getEndpoints(context: ConsentContext, options: C15tOptions) {
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
 * Creates a router that handles API requests
 */
export function router(context: ConsentContext, options: C15tOptions) {
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
			context.logger.error('API Error:', error);

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

	// Create a handler function for serving API requests
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
			context.logger.error('API error:', error);

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

	// Create a node-compatible handler
	const nodeHandler = (req: any, res: any) => {
		// Convert Node.js request to fetch Request
		const url = new URL(
			req.url || '',
			`http://${req.headers.host || 'localhost'}`
		);
		const request = new Request(url.toString(), {
			method: req.method,
			headers: new Headers(req.headers as any),
			body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
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
							res.write(chunk);
						},
						close() {
							res.end();
						},
						abort(err) {
							console.error('Error streaming response:', err);
							res.end();
						},
					})
				);
			})
			.catch((err) => {
				console.error('Handler error:', err);
				res.statusCode = 500;
				res.end(
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
