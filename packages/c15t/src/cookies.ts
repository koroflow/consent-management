/**
 * Cookie Management for c15t
 * 
 * This module provides utilities for managing cookies in the c15t consent management system.
 * It includes functions for creating, setting, reading, and deleting cookies, with special
 * handling for consent-related cookies.
 * 
 * The module supports both standard cookie operations and specialized functions for
 * consent token management, secure cookie signing, and cookie parsing.
 */
import type { ConsentRecord } from './types';
import type { EndpointContext } from './types';
import type { c15tOptions } from './types/options';
import { binary } from './utils/binary';
import { createHMAC } from './utils/crypto';
import { base64 } from './utils/encode';
import { isProduction } from './utils/env';

/**
 * Cookie configuration options
 * 
 * This interface defines the standard options that can be set on cookies,
 * following the RFC 6265 cookie specification.
 */
export interface CookieOptions {
	/**
	 * Maximum age of the cookie in seconds
	 */
	maxAge?: number;
	
	/**
	 * Expiration date for the cookie
	 */
	expires?: Date;
	
	/**
	 * Path for the cookie
	 * @default "/"
	 */
	path?: string;
	
	/**
	 * Domain for the cookie
	 */
	domain?: string;
	
	/**
	 * Whether the cookie should only be sent over HTTPS
	 * @default true in production
	 */
	secure?: boolean;
	
	/**
	 * Whether the cookie should be inaccessible to JavaScript
	 */
	httpOnly?: boolean;
	
	/**
	 * SameSite attribute for the cookie
	 * @default "lax"
	 */
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * c15t cookie configuration
 * 
 * This interface defines the structure of consent cookies used by the system,
 * including both the consent token and consent data cookies.
 */
export interface c15tCookies {
	/**
	 * Configuration for the consent token cookie
	 * This cookie stores a secure token that identifies the consent record
	 */
	consentToken: {
		/**
		 * Name of the cookie
		 */
		name: string;
		
		/**
		 * Cookie options
		 */
		options: CookieOptions;
	};
	
	/**
	 * Configuration for the consent data cookie
	 * This cookie stores a cached version of consent preferences for client-side access
	 */
	consentData: {
		/**
		 * Name of the cookie
		 */
		name: string;
		
		/**
		 * Cookie options
		 */
		options: CookieOptions;
	};
}

/**
 * Creates cookie configuration objects based on c15t options
 * 
 * This function generates the standard cookie configuration used by c15t,
 * including names and options for consent-related cookies.
 * 
 * @param options - c15t configuration options
 * @returns Cookie configuration for c15t
 * 
 * @example
 * ```typescript
 * const cookieConfig = getCookies({
 *   cookies: { 
 *     prefix: 'myapp',
 *     domain: '.example.com'
 *   }
 * });
 * // Creates cookies named "myapp.consent_token" and "myapp.consent_data"
 * ```
 */
export function getCookies(options: Partial<c15tOptions>): c15tCookies {
	const prefix = options.cookies?.prefix || 'c15t';
	const path = options.cookies?.path || '/';
	const secure = options.cookies?.secure ?? isProduction;
	const sameSite = options.cookies?.sameSite || 'lax';
	const domain = options.cookies?.domain;

	return {
		consentToken: {
			name: `${prefix}.consent_token`,
			options: {
				path,
				secure,
				sameSite,
				domain,
				httpOnly: true,
			},
		},
		consentData: {
			name: `${prefix}.consent_data`,
			options: {
				path,
				secure,
				sameSite,
				domain,
				httpOnly: false, // Client-side readable
				maxAge: options.consent?.cookieStorage?.maxAge || 600, // 10 minutes default
			},
		},
	};
}

/**
 * Creates a function for generating cookie strings
 * 
 * This factory function returns a cookie-generating function that incorporates
 * the global c15t cookie options with any custom options provided.
 * 
 * @param options - c15t configuration options
 * @returns A function that generates cookie strings
 * 
 * @example
 * ```typescript
 * const createCookie = createCookieGetter(c15tOptions);
 * 
 * // Generate a cookie string with the configured options
 * const cookieStr = createCookie('user_pref', 'theme:dark', { maxAge: 86400 });
 * ```
 */
export function createCookieGetter(options: Partial<c15tOptions>) {
	const cookies = getCookies(options);

	/**
	 * Generates a cookie string with appropriate options
	 * 
	 * @param name - Cookie name
	 * @param value - Cookie value
	 * @param opts - Additional cookie options that override defaults
	 * @returns A formatted cookie string for use in Set-Cookie header
	 */
	return (name: string, value: string, opts: CookieOptions = {}) => {
		const cookie = cookies[name as keyof c15tCookies];
		const cookieOptions = cookie ? { ...cookie.options, ...opts } : opts;

		return serializeCookie(name, value, cookieOptions);
	};
}

/**
 * Serializes cookie name, value, and options into a cookie string
 * 
 * This function creates a properly formatted cookie string according to
 * RFC 6265, suitable for use in Set-Cookie headers.
 * 
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns A formatted cookie string
 * 
 * @example
 * ```typescript
 * const cookieStr = serializeCookie('session', 'abc123', {
 *   maxAge: 3600,
 *   path: '/',
 *   secure: true,
 *   httpOnly: true
 * });
 * // "session=abc123; Max-Age=3600; Path=/; Secure; HttpOnly"
 * ```
 */
export function serializeCookie(
	name: string,
	value: string,
	options: CookieOptions = {}
): string {
	let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

	if (options.maxAge) {
		cookie += `; Max-Age=${options.maxAge}`;
	}

	if (options.expires) {
		cookie += `; Expires=${options.expires.toUTCString()}`;
	}

	if (options.path) {
		cookie += `; Path=${options.path}`;
	}

	if (options.domain) {
		cookie += `; Domain=${options.domain}`;
	}

	if (options.secure) {
		cookie += '; Secure';
	}

	if (options.httpOnly) {
		cookie += '; HttpOnly';
	}

	if (options.sameSite) {
		cookie += `; SameSite=${options.sameSite}`;
	}

	return cookie;
}

/**
 * Sets consent cookies in the response
 * 
 * This function creates and sets the consent token cookie, which contains
 * a cryptographically signed consent record ID. It also optionally sets
 * a client-readable consent data cookie if cookie storage is enabled.
 * 
 * @param ctx - The endpoint context for the request/response
 * @param consent - The consent record to store in cookies
 * @param options - Additional cookie options to apply
 * @returns A Promise that resolves when cookies are set
 * 
 * @example
 * ```typescript
 * // In an endpoint handler:
 * await setConsentCookie(ctx, consentRecord, { domain: '.example.com' });
 * ```
 */
export async function setConsentCookie(
	ctx: EndpointContext,
	consent: ConsentRecord,
	options: CookieOptions = {}
): Promise<void> {
	const tokenName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_token`;

	// Sign token for secure storage
	const signedToken = await createHMAC('SHA-256').sign(
		ctx.context.secret,
		consent.id
	);

	// Set the token cookie
	ctx.setCookie(tokenName, signedToken, {
		maxAge: Math.floor((consent.expiresAt.getTime() - Date.now()) / 1000),
		...options,
	});

	// Set cookie cache if enabled
	if (ctx.context.options.consent?.cookieStorage?.enabled) {
		await setCookieCache(ctx, consent);
	}
}

/**
 * Sets the consent data cache cookie
 * 
 * This function creates a client-readable cookie that contains the consent
 * preferences and a cryptographic signature to verify their authenticity.
 * This allows client-side code to access consent settings without an API call.
 * 
 * @param ctx - The endpoint context for the request/response
 * @param consent - The consent record to cache in cookies
 * @returns A Promise that resolves when the cache cookie is set
 */
export async function setCookieCache(
	ctx: EndpointContext,
	consent: ConsentRecord
): Promise<void> {
	if (!ctx.context.options.consent?.cookieStorage?.enabled) {
		return;
	}

	const dataName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_data`;
	const maxAge = ctx.context.options.consent?.cookieStorage?.maxAge || 600; // 10 minutes default
	const expiresAt = Date.now() + maxAge * 1000;

	// Create a signed version of the data
	const payload = {
		session: consent,
		expiresAt,
	};

	const signature = await createHMAC('SHA-256', 'base64urlnopad').sign(
		ctx.context.secret,
		JSON.stringify(payload)
	);

	const cookieData = {
		session: consent,
		signature,
		expiresAt,
	};

	// Encode and set the cookie
	const encodedData = base64.encode(binary.encode(JSON.stringify(cookieData)));

	ctx.setCookie(dataName, encodedData, {
		maxAge,
	});
}

/**
 * Deletes consent cookies
 * 
 * This function removes both the consent token and consent data cookies
 * by setting them to empty values with immediate expiration.
 * 
 * @param ctx - The endpoint context for the request/response
 * 
 * @example
 * ```typescript
 * // In a logout or consent revocation handler:
 * deleteConsentCookie(ctx);
 * ```
 */
export function deleteConsentCookie(ctx: EndpointContext): void {
	const tokenName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_token`;
	const dataName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_data`;

	// Clear cookies by setting empty value and zero max age
	ctx.setCookie(tokenName, '', { maxAge: 0 });
	ctx.setCookie(dataName, '', { maxAge: 0 });
}

/**
 * Parses a Cookie header string into a structured format
 * 
 * This function takes a raw Cookie header value and parses it into a Map
 * of cookie names to their values and attributes. It handles quoted values
 * and various cookie attribute formats.
 * 
 * @param cookieHeader - The raw Cookie header string to parse
 * @returns A Map of cookie names to their values and attributes
 * 
 * @example
 * ```typescript
 * const cookies = parseCookieHeader(request.headers.get('Cookie'));
 * 
 * if (cookies.has('session')) {
 *   const sessionValue = cookies.get('session')?.value;
 * }
 * ```
 */
export function parseCookieHeader(
	cookieHeader: string
): Map<string, Record<string, string>> {
	const result = new Map<string, Record<string, string>>();
	if (!cookieHeader) {
		return result;
	}

	const cookies = cookieHeader.split(/,(?=[^,]*=)/);

	for (const cookie of cookies) {
		const parts = cookie.split(';').map((part) => part.trim());
		// Fix: Check if nameValue exists before using it
		if (parts.length === 0) continue;

		const nameValue = parts[0];
		if (!nameValue) continue;

		const options = parts.slice(1);

		// Parse name and value
		const equalIndex = nameValue.indexOf('=');
		if (equalIndex === -1) {
			continue;
		}

		const name = nameValue.substring(0, equalIndex).trim();
		let value = nameValue.substring(equalIndex + 1).trim();

		if (value.startsWith('"') && value.endsWith('"')) {
			value = value.slice(1, -1);
		}

		const parsedOptions: Record<string, string> = { value };

		// Parse options
		for (const option of options) {
			const optionEqualIndex = option.indexOf('=');
			if (optionEqualIndex === -1) {
				parsedOptions[option.toLowerCase()] = 'true';
			} else {
				const optionName = option
					.substring(0, optionEqualIndex)
					.trim()
					.toLowerCase();
				let optionValue = option.substring(optionEqualIndex + 1).trim();

				if (optionValue.startsWith('"') && optionValue.endsWith('"')) {
					optionValue = optionValue.slice(1, -1);
				}

				parsedOptions[optionName] = optionValue;
			}
		}

		result.set(name, parsedOptions);
	}

	return result;
}
