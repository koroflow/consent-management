import {
  APIError,
  type Endpoint as BetterCallEndpoint,
  createEndpoint,
  createMiddleware,
  type MiddlewareContext,
  type MiddlewareOptions,
} from "better-call";
import type { ConsentContext } from "../types";

/**
 * Middleware that provides access to the c15t context
 */
export const contextMiddleware = createMiddleware(async () => {
  /**
   * This will be passed on the instance of
   * the context. Used to infer the type
   * here.
   */
  return {} as ConsentContext;
});

/**
 * Middleware that handles consent validation
 */
export const consentMiddleware = createMiddleware(async (context: MiddlewareContext<MiddlewareOptions>) => {
  const ctx = context as unknown as { context: ConsentContext; requiresConsent?: boolean };
  
  if (ctx.requiresConsent) {
    // Check consent status
    const hasConsent = await ctx.context.getConsentStatus?.();
    if (!hasConsent) {
      throw new APIError("BAD_REQUEST", {
        message: "Consent is required for this operation"
      });
    }
  }
  return {};
});

/**
 * Create middleware with proper context typing for c15t
 */
export const createConsentMiddleware = createMiddleware;

/**
 * Create endpoint with proper context typing for c15t
 */
export const createConsentEndpoint = createEndpoint;

/**
 * Type definition for response from c15t API endpoints
 */
export type EndpointResponse = Response | Record<string, unknown>;

/**
 * Type definition for c15t API endpoints
 */
export type ConsentEndpoint = BetterCallEndpoint;

/**
 * Type definition for c15t middleware
 */
export type ConsentMiddleware = ReturnType<typeof createConsentMiddleware>; 