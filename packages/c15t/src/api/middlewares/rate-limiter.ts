import { APIError, type MiddlewareContext, type MiddlewareOptions } from "better-call";
import { createConsentMiddleware } from "../call";

interface RateLimiterOptions {
  /**
   * Maximum number of requests in the time window
   */
  max?: number;
  
  /**
   * Time window in seconds
   */
  window?: number;
  
  /**
   * Key extractor function
   */
  keyExtractor?: (ctx: MiddlewareContext<MiddlewareOptions>) => string;
  
  /**
   * Store implementation
   */
  store?: RateLimiterStore;
}

/**
 * Simple interface for rate limiter storage
 */
export interface RateLimiterStore {
  /**
   * Increment a counter and return the current count
   */
  increment(key: string, ttl: number): Promise<number>;
  
  /**
   * Reset a counter
   */
  reset(key: string): Promise<void>;
}

/**
 * In-memory store implementation for rate limiting
 */
export class MemoryStore implements RateLimiterStore {
  private counters = new Map<string, { count: number; expires: number }>();
  
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
  
  async reset(key: string): Promise<void> {
    this.counters.delete(key);
  }
}

// Default memory store instance
const defaultStore = new MemoryStore();

/**
 * Default rate limiter options
 */
const DEFAULT_OPTIONS: Required<Omit<RateLimiterOptions, "keyExtractor">> = {
  max: 100,
  window: 60,
  store: defaultStore,
};

/**
 * Extract IP address from request for use as rate limit key
 */
function defaultKeyExtractor(ctx: MiddlewareContext<MiddlewareOptions>): string {
  const ip = 
    ctx.headers?.get('x-forwarded-for') || 
    ctx.headers?.get('x-real-ip') ||
    'unknown';
  
  return ip;
}

/**
 * Creates a rate limiter middleware
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
  const {
    max = DEFAULT_OPTIONS.max,
    window = DEFAULT_OPTIONS.window,
    store = DEFAULT_OPTIONS.store,
    keyExtractor = defaultKeyExtractor,
  } = options;

  return createConsentMiddleware(async (context: MiddlewareContext<MiddlewareOptions>) => {
    // We need to work around missing next() function
    const originalNext = (context as any).next;
    if (typeof originalNext !== 'function') {
      console.warn('Missing next function in middleware context');
      return {};
    }
    
    // Extract the key for rate limiting
    const key = keyExtractor(context);
    
    // Use path as the rate limit identifier if endpoint.name is not available
    const identifier = context.path || "default";
    
    // Increment counter
    const count = await store.increment(`${identifier}:${key}`, window);
    
    // Check if rate limit exceeded
    if (count > max) {
      throw new APIError("TOO_MANY_REQUESTS", {
        message: "Too many requests, please try again later",
        limit: max,
        window,
        reset: Math.ceil(window - (Date.now() % (window * 1000)) / 1000)
      });
    }
    
    // Continue with the request
    return await originalNext();
  });
} 