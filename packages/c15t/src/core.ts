/**
 * Core c15t Consent Management System
 *
 * This module provides the main factory function for creating c15t instances.
 * It handles initialization of the consent management context, sets up request handlers,
 * manages plugin integration, and exposes the necessary API endpoints.
 *
 * @remarks
 * The core module is responsible for:
 * - Initializing the consent management context
 * - Setting up request routing and URL configuration
 * - Managing trusted origins for CORS
 * - Integrating and exposing plugin functionality
 * - Providing type inference utilities for TypeScript users
 *
 * @example
 * ```typescript
 * import { c15t } from '@c15t/core';
 *
 * // Create a c15t instance with configuration
 * const consentManager = c15t({
 *   secret: process.env.SECRET_KEY,
 *   storage: memoryAdapter(),
 *   plugins: [
 *     geoPlugin(),
 *     analyticsPlugin()
 *   ]
 * });
 *
 * // Use the handler in your framework of choice
 * export default consentManager.handler;
 * ```
 */
import { init } from './init';
import { router } from './api/index';
import type { C15TOptions } from './types/options';
import type {
	InferPluginErrorCodes,
	ExtractPluginTypeDefinitions,
	C15TContext,
	C15TPlugin,
	InferPluginContexts,
} from './types';
import { getBaseURL } from './utils/url';
import type { FilterActions } from './types';
import { BASE_ERROR_CODES } from './error/codes';

/**
 * Creates a c15t consent management system instance
 *
 * This is the main factory function that creates a fully configured c15t instance.
 * It initializes the consent management context, sets up request handling,
 * configures plugins, and exposes the necessary API endpoints.
 *
 * @typeParam PluginTypes - The specific plugin types to use with the consent management system
 * @typeParam ConfigOptions - Configuration options type extending C15TOptions with plugin-specific settings
 *
 * @param options - Configuration options for the c15t instance
 * @returns A fully initialized c15t instance with request handler and API
 *
 * @example
 * ```typescript
 * // Create a c15t instance with custom storage and plugins
 * const C15TInstance = c15t({
 *   secret: 'your-secure-secret-key',
 *   storage: sqliteAdapter({
 *     filename: './consent.db'
 *   }),
 *   cookies: {
 *     prefix: 'myapp',
 *     domain: '.example.com'
 *   },
 *   plugins: [
 *     geoPlugin({ defaultJurisdiction: 'us-ca' }),
 *     analyticsPlugin({ providers: [...] })
 *   ]
 * });
 *
 * // Use in an Express app
 * app.use('/api/c15t', (req, res) => {
 *   C15TInstance.handler(new Request(req.url, {
 *     method: req.method,
 *     headers: req.headers,
 *     body: req.body
 *   })).then(response => {
 *     res.status(response.status);
 *     for (const [key, value] of response.headers.entries()) {
 *       res.setHeader(key, value);
 *     }
 *     return response.text();
 *   }).then(body => {
 *     res.send(body);
 *   });
 * });
 * ```
 */
export const c15t = <
	PluginTypes extends C15TPlugin[] = C15TPlugin[],
	ConfigOptions extends C15TOptions<PluginTypes> = C15TOptions<PluginTypes>,
>(
	options: ConfigOptions
): C15TInstance<PluginTypes> => {
	const C15TContextPromise = init(options);

	/**
	 * Processes incoming requests and routes them to the appropriate handler
	 *
	 * @param request - The incoming web request
	 * @returns A promise resolving to a web response
	 */
	const handler = async (request: Request): Promise<Response> => {
		const ctx = await C15TContextPromise;
		const basePath = ctx.options.basePath || '/api/auth';
		const url = new URL(request.url);
		if (!ctx.options.baseURL) {
			const baseURL =
				getBaseURL(undefined, basePath) || `${url.origin}${basePath}`;
			ctx.options.baseURL = baseURL;
			ctx.baseURL = baseURL;
		}

		// Extract trusted origins logic to avoid nested ternaries
		let originsFromOptions: string[] = [];
		if (options.trustedOrigins) {
			originsFromOptions = Array.isArray(options.trustedOrigins)
				? options.trustedOrigins
				: options.trustedOrigins(request);
		}

		ctx.trustedOrigins = [
			...originsFromOptions,
			ctx.options.baseURL || '',
			url.origin,
		];
		const { handler } = router(ctx, options);
		return handler(request);
	};

	// Store additional plugin error codes
	const errorCodes = options.plugins?.reduce<Record<string, string>>(
		(acc, plugin) => {
			if (plugin.$ERROR_CODES) {
				return Object.assign({}, acc, plugin.$ERROR_CODES);
			}
			return acc;
		},
		{}
	);

	/**
	 * Retrieves API endpoints from the router
	 *
	 * @returns A promise resolving to the available API endpoints
	 */
	const getApi = async () => {
		const context = await C15TContextPromise;

		// Make sure context has a valid baseURL before calling router
		if (!context.baseURL) {
			try {
				// Set a default baseURL temporarily to get endpoints
				context.baseURL = '/api/c15t';
				const { endpoints } = router(context, options);
				return endpoints;
			} catch (error) {
				context.logger.error('Error in getApi when calling router:', error);
				return {};
			}
		}

		try {
			const { endpoints } = router(context, options);
			return endpoints;
		} catch (error) {
			context.logger.error('Error in getApi when calling router:', error);
			return {};
		}
	};

	// Create a promise for the API endpoints but don't await it during initialization
	// biome-ignore lint/correctness/noUnusedVariables: warm up the api promise
	const apiPromise = getApi();

	// Combined error codes from base and plugins
	type CombinedErrorCodes = InferPluginErrorCodes<ConfigOptions> &
		typeof BASE_ERROR_CODES;

	// Construct the full consent management instance
	const instance: C15TInstance<PluginTypes> = {
		handler,
		api: {} as FilterActions<ReturnType<typeof router>['endpoints']>,
		options,
		$context: C15TContextPromise as Promise<
			C15TContext<InferPluginContexts<PluginTypes>>
		>,
		$Infer: {} as {
			Consent: {
				Context: InferPluginContexts<PluginTypes>;
				Record: ExtractPluginTypeDefinitions<ConfigOptions>;
			};
			Error: CombinedErrorCodes;
		},
		$ERROR_CODES: Object.assign(
			{},
			BASE_ERROR_CODES,
			errorCodes || {}
		) as CombinedErrorCodes,
	};

	return instance;
};

/**
 * Type definition for a c15t instance with specific plugin types
 *
 * @typeParam PluginTypes - The specific plugin types used in this instance
 */
export type C15TInstance<PluginTypes extends C15TPlugin[] = C15TPlugin[]> = {
	/**
	 * Request handler for processing incoming consent-related requests
	 *
	 * This function processes Web Standard Request objects and returns Response objects,
	 * making it compatible with modern web frameworks and environments.
	 *
	 * @param request - A standard Web Request object
	 * @returns A Promise resolving to a Web Response object
	 */
	handler: (request: Request) => Promise<Response>;

	/**
	 * API endpoints for interacting with the consent management system
	 *
	 * Provides access to all registered endpoints from core and plugins.
	 */
	api: FilterActions<ReturnType<typeof router>['endpoints']>;

	/**
	 * Configuration options used to create the instance
	 */
	options: C15TOptions<PluginTypes>;

	/**
	 * Error codes from the core system and all registered plugins
	 *
	 * These can be used for error handling and internationalization.
	 */
	$ERROR_CODES: InferPluginErrorCodes<C15TOptions<PluginTypes>> &
		typeof BASE_ERROR_CODES;

	/**
	 * Promise that resolves to the fully initialized consent context
	 *
	 * This is mainly for advanced usage scenarios where direct access
	 * to the context is required.
	 */
	$context: Promise<C15TContext<InferPluginContexts<PluginTypes>>>;

	/**
	 * Type inference helpers for TypeScript users
	 *
	 * Provides type definitions for consent contexts, records, and error codes.
	 */
	$Infer: {
		Consent: {
			Context: InferPluginContexts<PluginTypes>;
			Record: ExtractPluginTypeDefinitions<C15TOptions<PluginTypes>>;
		};
		Error: InferPluginErrorCodes<C15TOptions<PluginTypes>> &
			typeof BASE_ERROR_CODES;
	};

	/**
	 * Index signature for dynamic access to API handlers
	 *
	 * This allows using string keys to access API handlers, which is useful
	 * for integration adapters that need to dynamically call handlers.
	 */
	[key: string]: unknown;
};
