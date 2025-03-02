import { env } from '../utils/env';
import { C15TError } from '~/error';

// Define regex at the top level for better performance
const TRAILING_SLASHES_REGEX = /\/+$/;

function checkHasPath(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.pathname !== '/';
	} catch {
		throw new C15TError(
			`Invalid base URL: ${url}. Please provide a valid base URL.`
		);
	}
}

function withPath(url: string, path = '/api/auth') {
	const hasPath = checkHasPath(url);
	if (hasPath) {
		return url;
	}
	const pathWithSlash = path.startsWith('/') ? path : `/${path}`;
	return `${url.replace(TRAILING_SLASHES_REGEX, '')}${pathWithSlash}`;
}

export function getBaseURL(url?: string, path?: string) {
	if (url) {
		return withPath(url, path);
	}
	const fromEnv =
		env.C15T_URL ||
		env.NEXT_PUBLIC_C15T_URL ||
		env.PUBLIC_C15T_URL ||
		env.NUXT_PUBLIC_C15T_URL ||
		env.NUXT_PUBLIC_AUTH_URL ||
		(env.BASE_URL !== '/' ? env.BASE_URL : undefined);

	if (fromEnv) {
		return withPath(fromEnv, path);
	}

	if (typeof window !== 'undefined' && window.location) {
		return withPath(window.location.origin, path);
	}
	return undefined;
}

export function getOrigin(url: string) {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.origin;
	} catch {
		return null;
	}
}

export function getProtocol(url: string) {
	try {
		const parsedUrl = new URL(url);
		return parsedUrl.protocol;
	} catch {
		return null;
	}
}

export const checkURLValidity = (url: string) => {
	const urlPattern = url.includes('://');
	return urlPattern;
};

export function getHost(url: string) {
	if (url.includes('://')) {
		const parsedUrl = new URL(url);
		return parsedUrl.host;
	}
	return url;
}
