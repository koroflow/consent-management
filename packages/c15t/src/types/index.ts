// types/index.ts
import type { C15tOptions } from './options';
import type { C15tPlugin } from './plugins';
import type { Storage } from './storage';
import type { LoggerInterface } from '../utils/logger';

// Re-export important types
export type { C15tOptions } from './options';
export type { C15tPlugin } from './plugins';
export type { Storage } from './storage';

// Utility types
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type PrettifyDeep<T> = {
	[K in keyof T]: T[K] extends object ? PrettifyDeep<T[K]> : T[K];
};
export type LiteralUnion<T extends U, U = string> = T | (U & { _?: never });

// Core entities
export interface ConsentPurpose {
	id: string;
	name: string;
	description: string;
	required: boolean;
	default?: boolean;
	legalBasis?:
		| 'consent'
		| 'legitimate_interest'
		| 'legal_obligation'
		| 'contract'
		| 'vital_interest'
		| 'public_interest';
	expiry?: number; // in seconds
	createdAt: Date;
	updatedAt: Date;
}

export interface ConsentPreference {
	id: string;
	userId?: string;
	deviceId?: string;
	purposeId: string;
	allowed: boolean;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface ConsentRecord {
	id: string;
	userId?: string;
	deviceId?: string;
	preferences: Record<string, boolean>;
	createdAt: Date;
	updatedAt: Date;
	expiresAt: Date;
	ipAddress?: string;
	userAgent?: string;
	country?: string;
	region?: string;
}

export interface ConsentChangeEvent {
	timestamp: Date;
	recordId: string;
	userId?: string;
	deviceId?: string;
	purposeId: string;
	previousState?: boolean;
	newState: boolean;
	source: 'user' | 'system' | 'default' | 'import';
}

// Context interface for the consent system
export interface ConsentContext {
	options: C15tOptions;
	appName: string;
	baseURL: string;
	trustedOrigins: string[];
	currentConsent: ConsentRecord | null;
	setNewConsent: (consent: ConsentRecord | null) => void;
	newConsent: ConsentRecord | null;
	storage: Storage;
	secondaryStorage?: Storage;
	secret: string;
	logger: LoggerInterface;
	consentConfig: {
		expiresIn: number;
		updateAge: number;
		enabled?: boolean;
	};
	generateId: (options: { model: string; size?: number }) => string;
	createConsentCookie: (name: string, value: string, options?: any) => string;

	// API methods
	version?: string;
	getConsentStatus?: () => Promise<boolean>;
	getConsentPreferences?: () => Promise<Record<string, boolean> | null>;
	setConsentPreferences?: (
		preferences: Record<string, boolean>
	) => Promise<void>;
}

// API endpoint context
export interface EndpointContext {
	context: ConsentContext;
	request: Request;
	params: Record<string, string>;
	query: Record<string, string | string[] | undefined>;
	body: any;
	headers: Headers;
	cookies: Record<string, string>;
	json: <T>(data: T, options?: { status?: number }) => Response;
	setCookie: (name: string, value: string, options?: any) => void;
	getCookie: (name: string) => string | undefined;
	getSignedCookie: (name: string, secret: string) => Promise<string | null>;
}

// Plugin type inference
export type InferPluginTypes<O extends C15tOptions> =
	O['plugins'] extends Array<infer P>
		? P extends C15tPlugin
			? P['$InferServerPlugin'] extends infer SP
				? SP extends Record<string, any>
					? SP
					: {}
				: {}
			: {}
		: {};

export type InferPluginErrorCodes<O extends C15tOptions> =
	O['plugins'] extends Array<infer P>
		? P extends C15tPlugin
			? P['$ERROR_CODES'] extends infer EC
				? EC extends Record<string, any>
					? EC
					: {}
				: {}
			: {}
		: {};

// API inference helpers
export type FilterActions<T> = {
	[K in keyof T as T[K] extends Function ? K : never]: T[K];
};

export type InferAPI<T> = T extends (...args: any[]) => infer R ? R : never;
