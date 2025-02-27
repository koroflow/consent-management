import {
	APIError,
	type MiddlewareContext,
	type MiddlewareOptions,
} from 'better-call';
import { createConsentMiddleware } from '../call';

/**
 * Type extension for the middleware context to include the next function
 * that isn't properly typed in the original definition
 */
interface ExtendedMiddlewareContext
	extends MiddlewareContext<MiddlewareOptions> {
	/**
	 * The next function to be called in the middleware chain
	 */
	next: () => Promise<Response | Record<string, unknown>>;
}

/**
 * Configuration options for the rate limiter middleware
 *
 * @interface RateLimiterOptions
 */
interface RateLimiterOptions {
	/**
	 * Maximum number of requests allowed in the time window
	 * @default 100
	 */
	max?: number;

	/**
	 * Time window in seconds during which the requests are counted
	 * @default 60
	 */
	window?: number;

	/**
	 * Key extractor function to determine unique identifiers for rate limiting
	 * Usually extracts IP address or user identifier from the request
	 * @default IP address from x-forwarded-for or x-real-ip headers
	 */
	keyExtractor?: (ctx: MiddlewareContext<MiddlewareOptions>) => string;

	/**
	 * Store implementation for tracking rate limit counters
	 * @default MemoryStore instance
	 */
	store?: RateLimiterStore;
}

/**
 * Interface for rate limiter storage implementations
 *
 * This interface defines the required methods for any storage mechanism
 * used to track rate limit counters. Implementations can use memory,
 * Redis, or any other storage mechanism as long as they conform to this
 * interface.
 *
 * @interface RateLimiterStore
 */
export interface RateLimiterStore {
	/**
	 * Increment a counter and return the current count
	 *
	 * @param key - Unique identifier for the rate limit counter
	 * @param ttl - Time-to-live in seconds for the counter
	 * @returns Promise resolving to the current count after incrementing
	 */
	increment(key: string, ttl: number): Promise<number>;

	/**
	 * Reset a counter
	 *
	 * @param key - Unique identifier for the rate limit counter to reset
	 * @returns Promise that resolves when the counter has been reset
	 */
	reset(key: string): Promise<void>;
}

/**
 * In-memory store implementation for rate limiting
 *
 * This implementation stores rate limit counters in memory. It's suitable
 * for single-instance deployments or testing, but for production environments
 * with multiple instances, consider using a distributed store like Redis.
 *
 * @implements {RateLimiterStore}
 */
export class MemoryStore implements RateLimiterStore {
	/**
	 * Map storing counter records with expiration times
	 */
	private counters = new Map<string, { count: number; expires: number }>();

	/**
	 * Increment a counter and return the current count
	 *
	 * @param key - Unique identifier for the rate limit counter
	 * @param ttl - Time-to-live in seconds for the counter
	 * @returns Promise resolving to the current count after incrementing
	 */
	async increment(key: string, ttl: number): Promise<number> {
		const now = Date.now();
		const record = this.counters.get(key);

		// If no record or expired, create a new one
		if (!record || record.expires < now) {
			this.counters.set(key, {
				count: 1,
				expires: now + ttl * 1000,
			});
			return 1;
		}

		// Increment existing record
		record.count += 1;
		return record.count;
	}

	/**
	 * Reset a counter
	 *
	 * @param key - Unique identifier for the rate limit counter to reset
	 * @returns Promise that resolves when the counter has been reset
	 */
	async reset(key: string): Promise<void> {
		this.counters.delete(key);
	}
}

// Default memory store instance
const defaultStore = new MemoryStore();

/**
 * Default rate limiter options
 */
const DEFAULT_OPTIONS: Required<Omit<RateLimiterOptions, 'keyExtractor'>> = {
	max: 100,
	window: 60,
	store: defaultStore,
};

/**
 * Extract IP address from request for use as rate limit key
 *
 * @param ctx - Middleware context containing request information
 * @returns IP address or 'unknown' if not available
 */
function defaultKeyExtractor(
	ctx: MiddlewareContext<MiddlewareOptions>
): string {
	const ip =
		ctx.headers?.get('x-forwarded-for') ||
		ctx.headers?.get('x-real-ip') ||
		'unknown';

	return ip;
}

/**
 * Creates a rate limiter middleware
 *
 * This middleware limits the number of requests from a single client
 * within a specified time window. It uses the configured store to track
 * request counts and throws a TOO_MANY_REQUESTS error when the limit is
 * exceeded.
 *
 * @example
 * ```typescript
 * // Create a rate limiter with custom options
 * const apiRateLimiter = rateLimiter({
 *   max: 50,             // Allow 50 requests
 *   window: 60 * 15,     // Per 15 minutes
 *   keyExtractor: (ctx) => ctx.headers?.get('authorization') || 'anonymous'
 * });
 *
 * // Apply to your API
 * const api = createAPI({
 *   middlewares: [apiRateLimiter]
 * });
 * ```
 *
 * @param options - Configuration options for the rate limiter
 * @returns Middleware function for rate limiting requests
 * @throws {APIError} When rate limit is exceeded (status: TOO_MANY_REQUESTS)
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
	const {
		max = DEFAULT_OPTIONS.max,
		window = DEFAULT_OPTIONS.window,
		store = DEFAULT_OPTIONS.store,
		keyExtractor = defaultKeyExtractor,
	} = options;

	return createConsentMiddleware(
		async (context: MiddlewareContext<MiddlewareOptions>) => {
			// We need to work around missing next() function
			const ctx = context as ExtendedMiddlewareContext;
			if (typeof ctx.next !== 'function') {
				// biome-ignore lint/suspicious/noConsole: <explanation>
				console.warn('Missing next function in middleware context');
				return {};
			}

			// Extract the key for rate limiting
			const key = keyExtractor(context);

			// Use path as the rate limit identifier if endpoint.name is not available
			const identifier = context.path || 'default';

			// Increment counter
			const count = await store.increment(`${identifier}:${key}`, window);

			// Check if rate limit exceeded
			if (count > max) {
				throw new APIError('TOO_MANY_REQUESTS', {
					message: 'Too many requests, please try again later',
					limit: max,
					window,
					reset: Math.ceil(window - (Date.now() % (window * 1000)) / 1000),
				});
			}

			// Continue with the request
			return await ctx.next();
		}
	);
}
