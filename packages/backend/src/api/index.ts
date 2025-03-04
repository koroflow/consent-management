import {
	APIError,
	type Endpoint,
	type Middleware,
	type UnionToIntersection,
	createRouter,
} from 'better-call';
import type { C15TOptions, C15TPlugin, C15TContext } from '~/types';
import { getIp } from '~/utils/ip';

import { originCheckMiddleware } from './middlewares/origin-check';
import { validateContextMiddleware } from './middlewares/validate-context';
import { baseEndpoints } from './routes';
import { ok } from './routes/ok';
import { error } from './routes/error';
import { toEndpoints } from './to-endpoints';
import { logger } from '~/utils/logger';

/**
 * Retrieves and configures endpoints from plugins and core functionality
 *
 * This function collects endpoints from plugins, combines them with
 * base endpoints, and builds an API object with properly configured
 * handlers.
 *
 * @remarks
 * Plugin endpoints are merged with core endpoints, with core endpoints
 * taking precedence in case of naming conflicts.
 *
 * @typeParam ContextType - The specific context type extending C15TContext
 * @typeParam OptionsType - Configuration options type extending C15TOptions
 * @param ctx - The consent management context (or promise resolving to it)
 * @param options - Configuration options for the consent system
 * @returns Object containing API handlers and middleware configurations
 *
 * @example
 * ```typescript
 * const { api, middlewares } = getEndpoints(contextInstance, {
 *   plugins: [analyticsPlugin(), geoPlugin()]
 * });
 *
 * // Use the configured API
 * const response = await api.getConsentStatus({
 *   params: { userId: "123" }
 * });
 * ```
 */
export function getEndpoints<
	ContextType extends C15TContext,
	OptionsType extends C15TOptions,
>(ctx: Promise<ContextType> | ContextType, options: OptionsType) {
	const pluginEndpoints = options.plugins?.reduce<Record<string, Endpoint>>(
		(acc, plugin) => {
			if (plugin.endpoints) {
				Object.assign(acc, plugin.endpoints);
			}
			return acc;
		},
		{}
	);

	/**
	 * Type representing the intersection of all plugin endpoint types
	 *
	 * @internal
	 */
	type PluginEndpoint = UnionToIntersection<
		OptionsType['plugins'] extends Array<infer PluginType>
			? PluginType extends C15TPlugin
				? PluginType extends {
						endpoints: infer EndpointType;
					}
					? EndpointType
					: Record<string, never>
				: Record<string, never>
			: Record<string, never>
	>;

	const middlewares =
		options.plugins
			?.map((plugin) =>
				plugin.middlewares?.map((m) => {
					const middleware = (async (context: { context: ContextType }) => {
						return m.middleware({
							...context,
							context: {
								...ctx,
								...context.context,
							},
						});
					}) as Middleware;
					middleware.options = m.middleware.options;
					return {
						path: m.path,
						middleware,
					};
				})
			)
			.filter(
				(plugin): plugin is NonNullable<typeof plugin> => plugin !== undefined
			)
			.flat() || [];

	const endpoints = {
		...baseEndpoints,
		...pluginEndpoints,
		ok,
		error,
	};
	const api = toEndpoints(endpoints, ctx);
	return {
		api: api as typeof endpoints & PluginEndpoint,
		middlewares,
	};
}

/**
 * Creates a router for handling API requests
 *
 * Sets up routing with proper error handling, CORS, and response processing.
 * Integrates plugin-provided middlewares and response handlers.
 *
 * @remarks
 * This router automatically applies the origin check middleware to all routes
 * and handles error conditions appropriately based on configuration.
 *
 * @typeParam ContextType - The specific context type extending C15TContext
 * @typeParam OptionsType - Configuration options type extending C15TOptions
 * @param ctx - The initialized consent management context
 * @param options - Configuration options for the consent system
 * @returns A configured router with handler and endpoint functions
 * @throws May throw errors in the onError handler if options.onAPIError.throw is true
 *
 * @example
 * ```typescript
 * const consentRouter = router(contextInstance, {
 *   logger: { level: 'error' },
 *   plugins: [analyticsPlugin()]
 * });
 *
 * // Use the router to handle incoming requests
 * app.use('/api/consent', async (req, res) => {
 *   const response = await consentRouter.handler(
 *     new Request(`https://example.com${req.url}`, {
 *       method: req.method,
 *       headers: req.headers,
 *       body: req.body ? JSON.stringify(req.body) : undefined
 *     })
 *   );
 *
 *   // Send the response back
 *   res.status(response.status);
 *   response.headers.forEach((value, key) => {
 *     res.setHeader(key, value);
 *   });
 *   const body = await response.text();
 *   res.send(body);
 * });
 * ```
 */
export const router = <
	ContextType extends C15TContext,
	OptionsType extends C15TOptions,
>(
	ctx: ContextType,
	options: OptionsType
) => {
	const { api, middlewares } = getEndpoints(ctx, options);

	// Check for baseURL and properly handle it
	let basePath = '';
	try {
		if (ctx.baseURL) {
			const url = new URL(ctx.baseURL);
			basePath = url.pathname;
		}
	} catch {
		basePath = '/api/c15t';
	}
	// Ensure we have a valid basePath
	if (!basePath || basePath === '/') {
		basePath = '/api/c15t';
	}

	/**
	 * Configure and create the router instance
	 *
	 * @internal
	 */
	const routerInstance = createRouter(api, {
		routerContext: ctx,
		openapi: {
			disabled: true,
		},
		basePath,
		routerMiddleware: [
			{
				path: '/**',
				middleware: validateContextMiddleware,
			},
			{
				path: '/**',
				middleware: originCheckMiddleware,
			},
			...middlewares,
		],
		async onRequest(req) {
			// Add IP address to context
			(ctx as C15TContext).ipAddress = getIp(req, options);

			for (const plugin of ctx.options.plugins || []) {
				if (plugin.onRequest) {
					const response = await plugin.onRequest(req, ctx);
					if (response && 'response' in response) {
						return response.response;
					}
				}
			}
			return req;
		},

		/**
		 * Handle response processing through plugins
		 *
		 * @internal
		 * @param res - The response to process
		 * @returns The processed response
		 */
		async onResponse(res) {
			for (const plugin of ctx.options.plugins || []) {
				if (plugin.onResponse) {
					const response = await plugin.onResponse(res, ctx);
					if (response) {
						return response.response;
					}
				}
			}
			return res;
		},

		/**
		 * Handle errors that occur during request processing
		 *
		 * @internal
		 * @param e - The error that occurred
		 */
		onError(e) {
			if (e instanceof APIError && e.status === 'FOUND') {
				return;
			}
			if (options.onAPIError?.throw) {
				throw e;
			}
			if (options.onAPIError?.onError) {
				options.onAPIError.onError(e, ctx);
				return;
			}

			const optLogLevel = options.logger?.level;
			const log =
				optLogLevel === 'error' ||
				optLogLevel === 'warn' ||
				optLogLevel === 'debug'
					? logger
					: undefined;
			if (options.logger?.disabled !== true) {
				if (
					e &&
					typeof e === 'object' &&
					'message' in e &&
					typeof e.message === 'string' &&
					(e.message.includes('no column') ||
						e.message.includes('column') ||
						e.message.includes('relation') ||
						e.message.includes('table') ||
						e.message.includes('does not exist'))
				) {
					ctx.logger?.error(e.message);
					return;
				}

				if (e instanceof APIError) {
					if (e.status === 'INTERNAL_SERVER_ERROR') {
						ctx.logger.error(e.status, e);
					}
					log?.error(e.message);
				} else {
					ctx.logger?.error(
						e && typeof e === 'object' && 'name' in e ? (e.name as string) : '',
						e
					);
				}
			}
		},
	});

	return routerInstance;
};

// export * from './routes';
// export * from './middlewares';
export * from './call';
export { APIError } from 'better-call';
