/**
 * Binary String Utilities for c15t
 *
 * This module provides utility functions for encoding and decoding strings
 * to and from binary-safe representations, handling UTF-8 characters correctly.
 */

/**
 * Binary string encoding and decoding functions
 *
 * These functions handle converting between Unicode strings and binary strings,
 * ensuring proper handling of UTF-8 characters and special characters.
 */
export const binary = {
	/**
	 * Encodes a Unicode string to a binary-safe string
	 *
	 * This function converts a JavaScript string to a binary-safe representation
	 * by first encoding it as UTF-8 with encodeURIComponent, then converting
	 * the percent-encoded representation to binary with unescape.
	 *
	 * @param str - The Unicode string to encode
	 * @returns A binary-safe string representation
	 *
	 * @example
	 * ```typescript
	 * const binaryString = binary.encode('Hello 世界');
	 * ```
	 */
	encode(str: string): string {
		return unescape(encodeURIComponent(str));
	},

	/**
	 * Decodes a binary-safe string back to a Unicode string
	 *
	 * This function reverses the encoding process, first using escape to convert
	 * binary to percent-encoded form, then decodeURIComponent to get back the
	 * original Unicode string.
	 *
	 * @param str - The binary string to decode
	 * @returns The original Unicode string
	 *
	 * @example
	 * ```typescript
	 * const originalString = binary.decode(binaryString);
	 * // 'Hello 世界'
	 * ```
	 */
	decode(str: string): string {
		return decodeURIComponent(escape(str));
	},
};
