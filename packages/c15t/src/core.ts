import { init } from './init';
import { router } from './api/index';
import type { C15tOptions } from './types/options';
import type {
	InferPluginErrorCodes,
	InferPluginTypes,
	ConsentContext,
	Expand,
} from './types';
import { getBaseURL } from './utils/url';
import type { FilterActions } from './types';
import { BASE_ERROR_CODES } from './error/codes';

export type WithJsDoc<T, D> = Expand<T & D>;

export const c15t = <O extends C15tOptions>(options: O) => {
	const consentContextPromise = init(options);

	// Create a handler that awaits context initialization
	const handler = async (request: Request): Promise<Response> => {
		const ctx = await consentContextPromise;

		// Set up base path and URL
		const basePath = ctx.options.basePath || '/api/consent';
		const url = new URL(request.url);

		if (!ctx.options.baseURL) {
			const baseURL =
				getBaseURL(undefined, basePath) || `${url.origin}${basePath}`;
			ctx.options.baseURL = baseURL;
			ctx.baseURL = baseURL;
		}

		// Set trusted origins
		ctx.trustedOrigins = [
			...(options.trustedOrigins
				? Array.isArray(options.trustedOrigins)
					? options.trustedOrigins
					: options.trustedOrigins(request)
				: []),
			ctx.options.baseURL ?? url.origin,
			url.origin,
		];

		// Get router handler and process request
		const { handler: routerHandler } = router(ctx, options);
		return routerHandler(request);
	};

	// Store additional plugin error codes
	const errorCodes = options.plugins?.reduce((acc, plugin) => {
		if (plugin.$ERROR_CODES) {
			return Object.assign({}, acc, plugin.$ERROR_CODES);
		}
		return acc;
	}, {});

	// Get API endpoints (lazy-loaded)
	const getApi = async () => {
		const context = await consentContextPromise;
		const { endpoints } = router(context, options);
		return endpoints;
	};

	// Create a promise for the API endpoints
	const apiPromise = getApi();

	return {
		handler,
		// We're type-casting this for now since the API is loaded asynchronously
		api: {} as FilterActions<ReturnType<typeof router>['endpoints']>,
		options: options as O,
		$context: consentContextPromise,
		$Infer: {} as {
			Consent: {
				Context: ConsentContext;
				Record: InferPluginTypes<O>;
			};
			Error: InferPluginErrorCodes<O> & typeof BASE_ERROR_CODES;
		},
		$ERROR_CODES: Object.assign(
			{},
			BASE_ERROR_CODES,
			errorCodes || {}
		) as InferPluginErrorCodes<O> & typeof BASE_ERROR_CODES,
	};
};

export type C15tInstance = {
	handler: (request: Request) => Promise<Response>;
	api: FilterActions<ReturnType<typeof router>['endpoints']>;
	options: C15tOptions;
	$ERROR_CODES: typeof BASE_ERROR_CODES;
	$context: Promise<ConsentContext>;
};
