/**
 * Encoding Utilities for c15t
 *
 * This module provides encoding and decoding utilities for working with
 * different string formats in the c15t consent management system.
 */

/**
 * Base64 encoding and decoding functions
 *
 * Provides methods for encoding and decoding strings to and from base64 format,
 * with support for both browser and Node.js environments.
 */
export const base64 = {
	/**
	 * Encodes a string to base64
	 *
	 * Uses the appropriate encoding function based on the environment:
	 * - In browsers, it uses the global `btoa` function
	 * - In Node.js, it uses Buffer
	 *
	 * @param str - The string to encode
	 * @returns The base64 encoded string
	 * @throws Error if no encoding function is available in the current environment
	 *
	 * @example
	 * ```typescript
	 * const encoded = base64.encode('hello world');
	 * // "aGVsbG8gd29ybGQ="
	 * ```
	 */
	encode(str: string): string {
		if (typeof btoa === 'function') {
			return btoa(str);
		}
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(str).toString('base64');
		}
		throw new Error('No base64 encoding function available');
	},

	/**
	 * Decodes a base64 string
	 *
	 * Uses the appropriate decoding function based on the environment:
	 * - In browsers, it uses the global `atob` function
	 * - In Node.js, it uses Buffer
	 *
	 * @param str - The base64 string to decode
	 * @returns The decoded string
	 * @throws Error if no decoding function is available in the current environment
	 * @throws Error if the input is not valid base64 (via the underlying decoder)
	 *
	 * @example
	 * ```typescript
	 * const decoded = base64.decode('aGVsbG8gd29ybGQ=');
	 * // "hello world"
	 * ```
	 */
	decode(str: string): string {
		if (typeof atob === 'function') {
			return atob(str);
		}
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(str, 'base64').toString();
		}
		throw new Error('No base64 decoding function available');
	},
};
