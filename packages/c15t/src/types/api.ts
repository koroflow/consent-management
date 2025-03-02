/**
 * API Types for c15t
 *
 * Definitions for API routes, request handlers, and endpoint configuration
 */
import type { Endpoint } from 'better-call';

/**
 * Filter action methods from an object type
 *
 * This type utility extracts only the method properties from an object type,
 * useful for API type inference.
 */
export type FilterActions<TObject extends Record<string, unknown>> = {
	[Key in keyof TObject]: TObject[Key] extends (...args: unknown[]) => unknown
		? Key
		: never;
};

/**
 * Base API path template literals for type-safe route definition
 */
export type ApiPathBase = `/api/c15t`;

/**
 * API route path with strict type checking
 * Only allows valid path patterns
 */
export type ApiPath =
	| `${ApiPathBase}`
	| `${ApiPathBase}/consent`
	| `${ApiPathBase}/consent/:id`
	| `${ApiPathBase}/jurisdictions`
	| `${ApiPathBase}/jurisdictions/:code`
	| `${ApiPathBase}/plugins/:id`;

/**
 * Strongly-typed middleware configuration
 */
export interface ApiMiddleware {
	path: ApiPath;
	middleware: Endpoint;
}
