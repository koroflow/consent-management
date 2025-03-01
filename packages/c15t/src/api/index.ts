import {
	APIError,
	type Endpoint,
	type Middleware,
	type UnionToIntersection,
	createRouter,
} from 'better-call';
import type { C15TOptions, C15TPlugin, C15TContext } from '~/types';

import { originCheckMiddleware } from './middlewares/origin-check';
import { baseEndpoints } from './routes';
import { ok } from './routes/ok';
import { error } from './routes/error';
import { toAuthEndpoints } from './to-auth-endpoints';
import { logger } from '~/utils/logger';

export function getEndpoints<C extends C15TContext, Option extends C15TOptions>(
	ctx: Promise<C> | C,
	options: Option
) {
	const pluginEndpoints = options.plugins?.reduce<Record<string, Endpoint>>(
		(acc, plugin) => {
			return {
				// biome-ignore lint/performance/noAccumulatingSpread: <explanation>
				...acc,
				...plugin.endpoints,
			};
		},
		{}
	);

	type PluginEndpoint = UnionToIntersection<
		Option['plugins'] extends Array<infer T>
			? T extends C15TPlugin
				? T extends {
						endpoints: infer E;
					}
					? E
					: Record<string, never>
				: Record<string, never>
			: Record<string, never>
	>;

	const middlewares =
		options.plugins
			?.map((plugin) =>
				plugin.middlewares?.map((m) => {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const middleware = (async (context: { context: any; }) => {
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
			.filter((plugin) => plugin !== undefined)
			.flat() || [];

	const endpoints = {
		...baseEndpoints,
		...pluginEndpoints,
		ok,
		error,
	};
	const api = toAuthEndpoints(endpoints, ctx);
	return {
		api: api as typeof endpoints & PluginEndpoint,
		middlewares,
	};
}

export const router = <C extends C15TContext, Option extends C15TOptions>(
	ctx: C,
	options: Option
) => {
	const { api, middlewares } = getEndpoints(ctx, options);

	// Check for baseURL and properly handle it
	let basePath = '';
	try {
		if (ctx.baseURL) {
			basePath = new URL(ctx.baseURL).pathname;
		}
	} catch (error) {
		// Fallback to prevent crashing
		basePath = '/api/c15t';
	}

	const routerInstance = createRouter(api, {
		routerContext: ctx,
		openapi: {
			disabled: true,
		},
		basePath,
		routerMiddleware: [
			{
				path: '/**',
				middleware: originCheckMiddleware,
			},
			...middlewares,
		],
		// async onRequest(req) {
		// 	for (const plugin of ctx.options.plugins || []) {
		// 		if (plugin.onRequest) {
		// 			const response = await plugin.onRequest(req, ctx);
		// 			if (response && "response" in response) {
		// 				return response.response;
		// 			}
		// 		}
		// 	}
		// 	return onRequestRateLimit(req, ctx);
		// },
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
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
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
