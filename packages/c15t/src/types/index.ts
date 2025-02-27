/**
 * c15t Core Type Definitions
 * 
 * This module provides the core type definitions for the c15t consent management system.
 * It includes types for consent records, purposes, preferences, and the context objects
 * used throughout the system.
 */
// types/index.ts
import type { c15tOptions } from './options';
import type { c15tPlugin } from './plugins';
import type { Storage } from './storage';
import type { LoggerInterface } from '../utils/logger';

// Re-export important types
export type { c15tOptions } from './options';
export type { c15tPlugin } from './plugins';
export type { Storage } from './storage';

/**
 * Utility Types
 */

/**
 * Expands a type to show all its properties
 * Useful for debugging complex types
 */
export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

/**
 * Recursively prettifies a type by expanding all its nested properties
 * Useful for better type intellisense
 */
export type PrettifyDeep<T> = {
	[K in keyof T]: T[K] extends object ? PrettifyDeep<T[K]> : T[K];
};

/**
 * Allows for string literal types while still accepting any string
 * @example type ButtonType = LiteralUnion<'primary' | 'secondary', string>;
 */
export type LiteralUnion<T extends U, U = string> = T | (U & { _?: never });

/**
 * Cookie options for consent management
 */
export interface CookieOptions {
	/**
	 * Domain for the cookie
	 */
	domain?: string;
	
	/**
	 * Path for the cookie
	 * @default "/"
	 */
	path?: string;
	
	/**
	 * Max age in seconds
	 */
	maxAge?: number;
	
	/**
	 * HTTP only flag
	 */
	httpOnly?: boolean;
	
	/**
	 * Secure flag
	 */
	secure?: boolean;
	
	/**
	 * SameSite attribute
	 */
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Definition of a consent purpose
 * 
 * A purpose represents a specific use of personal data that requires consent,
 * such as analytics, marketing, or personalization.
 */
export interface ConsentPurpose {
	/**
	 * Unique identifier for the purpose
	 */
	id: string;
	
	/**
	 * Human-readable name of the purpose
	 */
	name: string;
	
	/**
	 * Detailed description of what this purpose entails
	 */
	description: string;
	
	/**
	 * Whether consent for this purpose is required
	 * Required purposes cannot be declined
	 */
	required: boolean;
	
	/**
	 * Default consent value if not explicitly set
	 */
	default?: boolean;
	
	/**
	 * Legal basis for processing under GDPR
	 */
	legalBasis?:
		| 'consent'
		| 'legitimate_interest'
		| 'legal_obligation'
		| 'contract'
		| 'vital_interest'
		| 'public_interest';
	
	/**
	 * Expiry in seconds for this specific purpose
	 */
	expiry?: number;
	
	/**
	 * When this purpose was created
	 */
	createdAt: Date;
	
	/**
	 * When this purpose was last updated
	 */
	updatedAt: Date;
}

/**
 * A specific consent preference for a purpose
 * 
 * Represents the consent status for a specific purpose, user, and/or device.
 */
export interface ConsentPreference {
	/**
	 * Unique identifier for the preference
	 */
	id: string;
	
	/**
	 * User ID (if available)
	 */
	userId?: string;
	
	/**
	 * Device ID (if available)
	 */
	deviceId?: string;
	
	/**
	 * The purpose this preference applies to
	 */
	purposeId: string;
	
	/**
	 * Whether consent is granted for this purpose
	 */
	allowed: boolean;
	
	/**
	 * When this preference expires
	 */
	expiresAt: Date;
	
	/**
	 * When this preference was created
	 */
	createdAt: Date;
	
	/**
	 * When this preference was last updated
	 */
	updatedAt: Date;
}

/**
 * A complete consent record
 * 
 * Represents the full consent state for a user/device combination,
 * including all purpose preferences
 */
export interface ConsentRecord {
	/**
	 * Unique identifier for the consent record
	 */
	id: string;
	
	/**
	 * User ID (if available)
	 */
	userId?: string;
	
	/**
	 * Device ID (if available)
	 */
	deviceId?: string;
	
	/**
	 * Map of purpose IDs to consent status
	 */
	preferences: Record<string, boolean>;
	
	/**
	 * When this record was created
	 */
	createdAt: Date;
	
	/**
	 * When this record was last updated
	 */
	updatedAt: Date;
	
	/**
	 * When this record expires
	 */
	expiresAt: Date;
	
	/**
	 * IP address of the user when consent was given
	 */
	ipAddress?: string;
	
	/**
	 * User agent of the browser/device when consent was given
	 */
	userAgent?: string;
	
	/**
	 * Country code (if geo-targeting is enabled)
	 */
	country?: string;
	
	/**
	 * Region or state code (if geo-targeting is enabled)
	 */
	region?: string;
}

/**
 * Record of a consent change
 * 
 * Represents a historical change to a consent preference,
 * useful for audit trails and compliance
 */
export interface ConsentChangeEvent {
	/**
	 * When the change occurred
	 */
	timestamp: Date;
	
	/**
	 * ID of the consent record that was changed
	 */
	recordId: string;
	
	/**
	 * User ID (if available)
	 */
	userId?: string;
	
	/**
	 * Device ID (if available)
	 */
	deviceId?: string;
	
	/**
	 * The purpose ID that was changed
	 */
	purposeId: string;
	
	/**
	 * The previous consent state
	 */
	previousState?: boolean;
	
	/**
	 * The new consent state
	 */
	newState: boolean;
	
	/**
	 * Source of the change
	 */
	source: 'user' | 'system' | 'default' | 'import';
}

/**
 * Request body for endpoint handlers
 */
export interface RequestBody {
	[key: string]: unknown;
}

/**
 * Context interface for the consent system
 * 
 * This is the main context object passed around throughout the system
 * and made available to plugins and endpoint handlers
 */
export interface ConsentContext {
	/**
	 * Configuration options
	 */
	options: c15tOptions;
	
	/**
	 * Application name
	 */
	appName: string;
	
	/**
	 * Base URL for API endpoints
	 */
	baseURL: string;
	
	/**
	 * Trusted origins for CORS
	 */
	trustedOrigins: string[];
	
	/**
	 * Current consent record
	 */
	currentConsent: ConsentRecord | null;
	
	/**
	 * Set a new consent record
	 */
	setNewConsent: (consent: ConsentRecord | null) => void;
	
	/**
	 * New consent record (if one is being created/updated)
	 */
	newConsent: ConsentRecord | null;
	
	/**
	 * Primary storage adapter
	 */
	storage: Storage;
	
	/**
	 * Secondary storage adapter (if configured)
	 */
	secondaryStorage?: Storage;
	
	/**
	 * Secret for signing cookies and tokens
	 */
	secret: string;
	
	/**
	 * Logger interface
	 */
	logger: LoggerInterface;
	
	/**
	 * Consent configuration
	 */
	consentConfig: {
		/**
		 * Consent expiration time in seconds
		 */
		expiresIn: number;
		
		/**
		 * Time in seconds before refreshing consent data
		 */
		updateAge: number;
		
		/**
		 * Whether consent is enabled
		 */
		enabled?: boolean;
	};
	
	/**
	 * Generate an ID for a model
	 */
	generateId: (options: { model: string; size?: number }) => string;
	
	/**
	 * Create a consent cookie
	 */
	createConsentCookie: (name: string, value: string, options?: CookieOptions) => string;

	// API methods
	/**
	 * API version
	 */
	version?: string;
	
	/**
	 * Get overall consent status
	 */
	getConsentStatus?: () => Promise<boolean>;
	
	/**
	 * Get all consent preferences
	 */
	getConsentPreferences?: () => Promise<Record<string, boolean> | null>;
	
	/**
	 * Set multiple consent preferences
	 */
	setConsentPreferences?: (
		preferences: Record<string, boolean>
	) => Promise<void>;
}

/**
 * API endpoint context
 * 
 * This context is available to API endpoint handlers
 */
export interface EndpointContext {
	/**
	 * Consent system context
	 */
	context: ConsentContext;
	
	/**
	 * The HTTP request
	 */
	request: Request;
	
	/**
	 * URL path parameters
	 */
	params: Record<string, string>;
	
	/**
	 * Query string parameters
	 */
	query: Record<string, string | string[] | undefined>;
	
	/**
	 * Request body
	 */
	body: RequestBody;
	
	/**
	 * Request headers
	 */
	headers: Headers;
	
	/**
	 * Cookies from the request
	 */
	cookies: Record<string, string>;
	
	/**
	 * Send a JSON response
	 */
	json: <T>(data: T, options?: { status?: number }) => Response;
	
	/**
	 * Set a cookie in the response
	 */
	setCookie: (name: string, value: string, options?: CookieOptions) => void;
	
	/**
	 * Get a cookie from the request
	 */
	getCookie: (name: string) => string | undefined;
	
	/**
	 * Get and verify a signed cookie
	 */
	getSignedCookie: (name: string, secret: string) => Promise<string | null>;
}

// Plugin type inference
/**
 * Infer plugin types from configuration options
 * 
 * This type utility extracts the plugin types from a configuration object,
 * allowing TypeScript to understand the extensions provided by plugins.
 */
export type InferPluginTypes<O extends c15tOptions> =
	O['plugins'] extends Array<infer P>
		? P extends c15tPlugin
			? P['$InferServerPlugin'] extends infer SP
				? SP extends Record<string, unknown>
					? SP
					: Record<string, never>
				: Record<string, never>
			: Record<string, never>
		: Record<string, never>;

/**
 * Infer plugin error codes from configuration options
 * 
 * This type utility extracts the error codes defined by plugins from a configuration object,
 * allowing TypeScript to understand the possible error codes.
 */
export type InferPluginErrorCodes<O extends c15tOptions> =
	O['plugins'] extends Array<infer P>
		? P extends c15tPlugin
			? P['$ERROR_CODES'] extends infer EC
				? EC extends Record<string, unknown>
					? EC
					: Record<string, never>
				: Record<string, never>
			: Record<string, never>
		: Record<string, never>;

// API inference helpers
/**
 * Filter action methods from an object type
 * 
 * This type utility extracts only the method properties from an object type,
 * useful for API type inference.
 */
export type FilterActions<T> = {
	[K in keyof T as T[K] extends (...args: unknown[]) => unknown ? K : never]: T[K];
};

/**
 * Infer the return type of an API function
 * 
 * This type utility extracts the return type of a function,
 * useful for API type inference.
 */
export type InferAPI<T> = T extends (...args: unknown[]) => infer R ? R : never;
