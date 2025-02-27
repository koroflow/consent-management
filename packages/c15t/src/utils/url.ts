/**
 * URL Utilities for c15t
 * 
 * This module provides URL-related utility functions for determining
 * base URLs and constructing API endpoints in the c15t consent management system.
 */
import { env } from './env';

/**
 * Determines the base URL for the c15t API
 * 
 * This function constructs a complete base URL for the API by combining
 * a provided base URL with a base path. If no base URL is provided, it tries
 * to retrieve one from environment variables.
 * 
 * @param baseURL - Optional base URL to use (e.g., 'https://example.com')
 * @param basePath - Optional base path to append to the URL (default: '/api/consent')
 * @returns The complete base URL as a string, or undefined if no base URL could be determined
 * 
 * @example
 * ```typescript
 * // With explicit baseURL
 * const apiUrl = getBaseURL('https://myapp.com', '/api/v1/consent');
 * // "https://myapp.com/api/v1/consent"
 * 
 * // Using environment variables and default path
 * // (if C15T_URL="https://myapp.com")
 * const apiUrl = getBaseURL();
 * // "https://myapp.com/api/consent"
 * ```
 */
export function getBaseURL(
	baseURL?: string,
	basePath?: string
): string | undefined {
	if (baseURL) {
		const url = new URL(basePath || '/api/consent', baseURL);
		return url.toString();
	}

	// Try to get from environment variables
	const envBaseURL =
		env.C15T_URL ||
		env.CONSENT_URL ||
		env.NEXT_PUBLIC_C15T_URL ||
		env.NEXT_PUBLIC_CONSENT_URL;

	if (envBaseURL) {
		const url = new URL(basePath || '/api/consent', envBaseURL);
		return url.toString();
	}

	return undefined;
}
