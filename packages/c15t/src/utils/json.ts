/**
 * JSON Utilities for c15t
 *
 * This module provides utility functions for safely parsing and handling
 * JSON data in the c15t consent management system.
 */

/**
 * Safely parses a JSON string, returning a default value on failure
 *
 * This function attempts to parse a JSON string, but unlike the standard
 * JSON.parse, it doesn't throw an exception on invalid JSON. Instead, it
 * returns a provided default value.
 *
 * @template T - The expected type of the parsed JSON
 * @param value - The JSON string to parse
 * @param defaultValue - The value to return if parsing fails (default: null)
 * @returns The parsed JSON object as type T, or defaultValue if parsing fails
 *
 * @example
 * ```typescript
 * // Successfully parse valid JSON
 * const data = safeJSONParse<{ id: string }>('{"id": "123"}');
 * // { id: "123" }
 *
 * // Return default value for invalid JSON
 * const badData = safeJSONParse<string[]>('not json', []);
 * // []
 * ```
 */
export function safeJSONParse<T>(
	value: string,
	defaultValue: T | null = null
): T | null {
	try {
		return JSON.parse(value) as T;
	} catch {
		return defaultValue;
	}
}
