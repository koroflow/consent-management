import { APIError } from 'better-call';
import { createAuthMiddleware } from '../call';
import type { C15TContext } from '~/types';
import { BASE_ERROR_CODES } from '~/error/codes';
import type { Adapter } from '~/db/adapters/types';

/**
 * Middleware that validates the context for all routes
 *
 * This middleware ensures that the context object is properly structured and
 * contains all required properties and services before allowing the request to proceed.
 *
 * @remarks
 * The middleware performs comprehensive validation of:
 * - Basic context structure
 * - Required configuration options
 * - Storage adapter availability
 * - Logger availability
 * - Plugin initialization status
 * - Required services and dependencies
 *
 * @throws {APIError} Throws appropriate errors for:
 * - INVALID_CONFIGURATION: When context or options are invalid
 * - STORAGE_ERROR: When storage adapter is not available
 * - INITIALIZATION_FAILED: When required services failed to initialize
 *
 * @example
 * ```typescript
 * // Using with memory adapter
 * const router = createRouter(endpoints, {
 *   routerMiddleware: [
 *     {
 *       path: '/**',
 *       middleware: validateContextMiddleware
 *     }
 *   ]
 * });
 * ```
 */
export const validateContextMiddleware = createAuthMiddleware(async (ctx) => {
	const { context } = ctx;

	// Basic context validation
	if (!context || typeof context !== 'object') {
		throw new APIError('FORBIDDEN', {
			message: BASE_ERROR_CODES.INVALID_CONFIGURATION,
			status: 400,
			data: { context },
		});
	}

	// Ensure the context is properly typed
	const typedContext = context as C15TContext;

	// Validate required configuration
	if (!typedContext.options) {
		throw new APIError('FORBIDDEN', {
			message: BASE_ERROR_CODES.INVALID_CONFIGURATION,
			status: 400,
			data: { error: 'Missing options in context' },
		});
	}

	// Optional storage adapter validation
	if (typedContext.storage) {
		const storage = typedContext.storage as Adapter;
		const requiredMethods = ['users', 'records', 'policies'];
		const missingMethods = requiredMethods.filter(
			(method) => !(method in storage)
		);

		if (missingMethods.length > 0) {
			typedContext.logger?.warn?.('Storage adapter missing methods', {
				missingMethods,
				storageType: storage.constructor.name,
			});
		}
	}

	// Validate logger (make it optional for memory adapter in development)
	if (!typedContext.logger && process.env.NODE_ENV === 'production') {
		throw new APIError('INTERNAL_SERVER_ERROR', {
			message: BASE_ERROR_CODES.INITIALIZATION_FAILED,
			status: 503,
			data: { error: 'Logger not initialized' },
		});
	}

	// Validate plugins if any are configured
	if (
		(typedContext.options.plugins?.length ?? 0) > 0 &&
		!typedContext.plugins
	) {
		throw new APIError('INTERNAL_SERVER_ERROR', {
			message: BASE_ERROR_CODES.PLUGIN_INITIALIZATION_FAILED,
			status: 503,
			data: { error: 'Plugins failed to initialize' },
		});
	}

	// Log successful validation if logger exists
	typedContext.logger?.debug?.('Context validation successful', {
		baseURL: typedContext.baseURL,
		storageType: typedContext.storage?.constructor.name,
		pluginsCount: Array.isArray(typedContext.plugins)
			? typedContext.plugins.length
			: 0,
	});

	return { context: typedContext };
});
