/**
 * ID Generation Utilities for c15t
 * 
 * This module provides functions for generating unique identifiers
 * that are used throughout the c15t consent management system.
 */

/**
 * Generates a cryptographically secure random ID string
 * 
 * This function creates a random ID using the Web Crypto API when available,
 * with a fallback to Math.random() for environments without crypto support.
 * The resulting ID uses a URL-safe character set (A-Z, a-z, 0-9).
 * 
 * @param length - The length of the ID to generate (default: 21)
 * @returns A random string of the specified length
 * 
 * @example
 * ```typescript
 * // Generate a default length (21 character) ID
 * const id = generateId();
 * // "7f4s9hDk3lZx2Yp0qR5tW"
 * 
 * // Generate a shorter ID
 * const shortId = generateId(8);
 * // "j8Hp4tZx"
 * ```
 */
export function generateId(length = 21): string {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.getRandomValues === 'function'
	) {
		const charset =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);

		let result = '';
		for (let i = 0; i < length; i++) {
			// TypeScript needs assurance the index access is valid
			// Uint8Array will always have values after getRandomValues
			const value = array[i] || 0; // Fallback to 0 if somehow undefined
			result += charset.charAt(value % charset.length);
		}

		return result;
	}

	// Fallback for environments without crypto
	const charset =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += charset.charAt(Math.floor(Math.random() * charset.length));
	}

	return result;
}
