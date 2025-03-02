import { APIError } from 'better-call';
import { createAuthMiddleware } from '../call';
import type { C15TContext } from '~/types';
import { BASE_ERROR_CODES } from '~/error/codes';

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
 * - Database connection and adapter
 * - Logger availability
 * - Plugin initialization status
 * - Required services and dependencies
 *
 * This helps prevent runtime errors and provides clear error messages when
 * critical services are unavailable.
 *
 * @throws {APIError} Throws appropriate errors for:
 * - INVALID_CONFIGURATION: When context or options are invalid
 * - DATABASE_CONNECTION_ERROR: When database is not available
 * - INITIALIZATION_FAILED: When required services failed to initialize
 *
 * @example
 * ```typescript
 * // This middleware is typically used in router configuration
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

	// Validate database connection
	if (!typedContext.db || !typedContext.storage) {
		throw new APIError('INTERNAL_SERVER_ERROR', {
			message: BASE_ERROR_CODES.DATABASE_CONNECTION_ERROR,
			status: 503,
			data: {
				error: 'Database connection not available',
				db: !!typedContext.db,
				storage: !!typedContext.storage,
			},
		});
	}

	// Validate logger
	if (!typedContext.logger) {
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

	// Log successful validation
	typedContext.logger.debug('Context validation successful', {
		baseURL: typedContext.baseURL,
		pluginsCount: Array.isArray(typedContext.plugins)
			? typedContext.plugins.length
			: 0,
	});

	return { context: typedContext };
});
