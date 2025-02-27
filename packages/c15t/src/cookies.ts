import type { ConsentRecord } from './types';
import type { EndpointContext } from './types';
import type { C15tOptions } from './types/options';
import { binary } from './utils/binary';
import { createHMAC } from './utils/crypto';
import { base64 } from './utils/encode';
import { isProduction } from './utils/env';

export interface CookieOptions {
	maxAge?: number;
	expires?: Date;
	path?: string;
	domain?: string;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
}

export interface C15tCookies {
	consentToken: {
		name: string;
		options: CookieOptions;
	};
	consentData: {
		name: string;
		options: CookieOptions;
	};
}

export function getCookies(options: Partial<C15tOptions>): C15tCookies {
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

export function createCookieGetter(options: Partial<C15tOptions>) {
	const cookies = getCookies(options);

	return (name: string, value: string, opts: CookieOptions = {}) => {
		const cookie = cookies[name as keyof C15tCookies];
		const cookieOptions = cookie ? { ...cookie.options, ...opts } : opts;

		return serializeCookie(name, value, cookieOptions);
	};
}

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

export function deleteConsentCookie(ctx: EndpointContext): void {
	const tokenName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_token`;
	const dataName = `${ctx.context.options?.cookies?.prefix || 'c15t'}.consent_data`;

	// Clear cookies by setting empty value and zero max age
	ctx.setCookie(tokenName, '', { maxAge: 0 });
	ctx.setCookie(dataName, '', { maxAge: 0 });
}

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
