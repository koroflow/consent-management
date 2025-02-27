import {
	APIError,
	type Middleware,
	type UnionToIntersection,
	createRouter,
} from 'better-call';
import type { c15tOptions, c15tPlugin, ConsentContext } from '../types';

import { originCheckMiddleware } from './middlewares/origin-check';
import { baseEndpoints } from './routes';
import { ok } from './routes/ok';
// import { signUpEmail } from "./routes/sign-up";
import { error } from './routes/error';
// import { logger } from "../utils/logger";
// import type { BetterAuthPlugin } from "../plugins";
// import { onRequestRateLimit } from "./rate-limiter";
import { toAuthEndpoints } from './to-auth-endpoints';
import { logger } from '~/utils/logger';

export function getEndpoints<
	C extends ConsentContext,
	Option extends c15tOptions,
>(ctx: Promise<C> | C, options: Option) {
	const pluginEndpoints = options.plugins?.reduce(
		(acc, plugin) => {
			return {
				...acc,
				...plugin.endpoints,
			};
		},
		{} as Record<string, any>
	);

	type PluginEndpoint = UnionToIntersection<
		Option['plugins'] extends Array<infer T>
			? T extends c15tPlugin
				? T extends {
						endpoints: infer E;
					}
					? E
					: {}
				: {}
			: {}
	>;

	const middlewares =
		options.plugins
			?.map((plugin) =>
				plugin.middlewares?.map((m) => {
					const middleware = (async (context: any) => {
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

export const router = <C extends ConsentContext, Option extends c15tOptions>(
	ctx: C,
	options: Option
) => {
	const { api, middlewares } = getEndpoints(ctx, options);
	
	// Add debug logs to see what endpoints are registered
	console.log("DEBUG Registered endpoints:", Object.keys(api));
	
	// Check for baseURL and properly handle it
	let basePath = '';
	try {
		if (ctx.baseURL) {
			basePath = new URL(ctx.baseURL).pathname;
			console.log("DEBUG Router basePath:", basePath);
		} 
	} catch (error) {
		console.error('ERROR creating URL from ctx.baseURL:', error);
		console.error('Invalid baseURL value:', ctx.baseURL);
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
	
	// Log the router's handler and endpoints for debugging
	console.log("DEBUG Router handler available:", typeof routerInstance.handler === 'function');
	console.log("DEBUG Router endpoints:", routerInstance.endpoints ? "Available" : "Not available");
	
	return routerInstance;
};

// export * from './routes';
// export * from './middlewares';
export * from './call';
export { APIError } from 'better-call';
