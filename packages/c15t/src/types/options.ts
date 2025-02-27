/**
 * c15t Consent Management System Configuration Types
 *
 * This module defines the configuration options for the c15t consent management system.
 * It includes types for setting up storage, API endpoints, cookies, rate limiting,
 * analytics, geo-targeting, plugins, logging, and other advanced features.
 */
import type { Storage } from './storage';
import type { c15tPlugin } from './plugins';
import type { Logger } from '../utils/logger';
import type { C15TContext } from '.';
import type { AuthMiddleware } from '~/api/call';

/**
 * Analytics destination configuration
 */
export interface AnalyticsDestination {
	/**
	 * Type of analytics destination (e.g., 'google-analytics', 'segment')
	 */
	type: string;

	/**
	 * Configuration options specific to this analytics destination
	 */
	options: Record<string, unknown>;
}

/**
 * Cookie configuration options
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
	 * Maximum age of the cookie in seconds
	 */
	maxAge?: number;

	/**
	 * SameSite attribute
	 * @default "lax"
	 */
	sameSite?: 'strict' | 'lax' | 'none';

	/**
	 * Secure attribute
	 * @default true in production
	 */
	secure?: boolean;
}

/**
 * Logger metadata type
 */
export type LoggerMetadata = Record<
	string,
	string | number | boolean | null | undefined
>;

/**
 * Custom logger implementation
 */
export interface CustomLogger {
	/**
	 * Log debug level messages
	 * @param message - Message to log
	 * @param meta - Optional metadata to include
	 */
	debug: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Log info level messages
	 * @param message - Message to log
	 * @param meta - Optional metadata to include
	 */
	info: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Log warning level messages
	 * @param message - Message to log
	 * @param meta - Optional metadata to include
	 */
	warn: (message: string, meta?: LoggerMetadata) => void;

	/**
	 * Log error level messages
	 * @param message - Message to log
	 * @param meta - Optional metadata to include
	 */
	error: (message: string, meta?: LoggerMetadata) => void;
}

/**
 * Main configuration options for the c15t consent management system
 */
export interface C15TOptions {
	/**
	 * The base URL for the API (optional if running in a browser)
	 * @example "https://example.com"
	 */
	baseURL?: string;

	/**
	 * The base path for API endpoints
	 * @default "/api/c15t"
	 * @example "/api/c15t"
	 */
	basePath?: string;

	/**
	 * Storage provider for consent data
	 * This is required and can be a Storage object or a string identifier
	 * @example "memory"
	 */
	storage: Storage;

	/**
	 * Secondary storage for distributed environments (optional)
	 * Used as a fallback if primary storage fails and for data redundancy
	 */
	secondaryStorage?: Storage;

	/**
	 * Application name shown in consent dialogs
	 * @example "My App"
	 */
	appName?: string;

	/**
	 * Secret used for signing cookies and tokens
	 * Should be a strong, unique string in production environments
	 */
	secret?: string;

	/**
	 * Enable CORS support
	 * @default true
	 */
	cors?: boolean;

	/**
	 * Trusted origins for CORS
	 * Can be an array of origin strings or a function that returns origins based on the request
	 * @example ["https://example.com", "https://www.example.com"]
	 */
	trustedOrigins?: string[] | ((request: Request) => string[]);

	/**
	 * Consent configuration options
	 * Controls how consent is stored, when it expires, and other consent-specific settings
	 */
	consent?: {
		/**
		 * Default expiration for consent in seconds
		 * @default 31536000 (1 year)
		 */
		expiresIn?: number;

		/**
		 * Time in seconds before refreshing consent data
		 * @default 86400 (24 hours)
		 */
		updateAge?: number;

		/**
		 * Store consent in cookies
		 * When enabled, a summary of consent preferences is stored in a cookie
		 * for faster access without database queries
		 */
		cookieStorage?: {
			/**
			 * Whether to enable cookie storage for consent
			 */
			enabled: boolean;

			/**
			 * How long to cache consent data in the cookie
			 * @default 600 (10 minutes)
			 */
			maxAge?: number;

			/**
			 * Cookie domain configuration
			 * @example ".example.com" for all subdomains
			 */
			domain?: string;

			/**
			 * Cookie path
			 * @default "/"
			 */
			path?: string;

			/**
			 * Same site attribute
			 * @default "lax"
			 */
			sameSite?: 'strict' | 'lax' | 'none';

			/**
			 * Secure attribute
			 * @default true in production
			 */
			secure?: boolean;
		};
	};

	/**
	 * Cookie configuration
	 * Default settings for all cookies set by the system
	 */
	cookies?: {
		/**
		 * Prefix for cookie names
		 * @default "c15t"
		 */
		prefix?: string;

		/**
		 * Domain for cookies
		 * @example ".example.com" for all subdomains
		 */
		domain?: string;

		/**
		 * Path for cookies
		 * @default "/"
		 */
		path?: string;

		/**
		 * SameSite attribute
		 * @default "lax"
		 */
		sameSite?: 'strict' | 'lax' | 'none';

		/**
		 * Secure attribute
		 * @default true in production
		 */
		secure?: boolean;
	};

	/**
	 * Analytics configuration
	 * Settings for tracking consent-related events
	 */
	analytics?: {
		/**
		 * Enable analytics
		 * @default true
		 */
		enabled?: boolean;

		/**
		 * Destinations for analytics data
		 * Each destination has a type and configuration options
		 */
		destinations?: Array<AnalyticsDestination>;
	};

	/**
	 * Geo-targeting configuration
	 * Settings for location-based consent rules
	 */
	geo?: {
		/**
		 * Enable geo-targeting
		 * @default true
		 */
		enabled?: boolean;

		/**
		 * Additional geo configuration options
		 * These can include IP headers, data sources, jurisdiction rules, etc.
		 */
		[key: string]: unknown;
	};

	/**
	 * Plugins to extend functionality
	 * Array of plugin objects that add features to the consent system
	 */
	plugins?: c15tPlugin[];

	/**
	 * Logger configuration
	 * Controls how events are logged
	 */
	logger?: Logger;

	/**
	 * Advanced configuration options
	 * Settings for specialized use cases
	 */
	advanced?: {
		/**
		 * Ip address configuration
		 */
		ipAddress?: {
			/**
			 * List of headers to use for ip address
			 *
			 * Ip address is used for rate limiting and session tracking
			 *
			 * @example ["x-client-ip", "x-forwarded-for"]
			 *
			 * @default
			 * @link https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/utils/get-request-ip.ts#L8
			 */
			ipAddressHeaders?: string[];
			/**
			 * Disable ip tracking
			 *
			 * ⚠︎ This is a security risk and it may expose your application to abuse
			 */
			disableIpTracking?: boolean;
		};

		/**
		 * Disable trusted origins check
		 *
		 * ⚠︎ This is a security risk and it may expose your application to CSRF attacks
		 */
		disableCSRFCheck?: boolean;

		/**
		 * Function to generate IDs
		 * Custom ID generation for consent records and other entities
		 */
		generateId?: (options: { model: string; size?: number }) => string;

		/**
		 * Support for cross-subdomain cookies
		 * Enables sharing consent state across subdomains
		 */
		crossSubDomainCookies?: {
			/**
			 * Whether to enable cross-subdomain cookies
			 */
			enabled: boolean;

			/**
			 * Root domain to use for cookies
			 * @example ".example.com"
			 */
			domain?: string;
		};
	};
	/**
	 * API error handling
	 */
	onAPIError?: {
		/**
		 * Throw an error on API error
		 *
		 * @default false
		 */
		throw?: boolean;
		/**
		 * Custom error handler
		 *
		 * @param error
		 * @param ctx - Auth context
		 */
		onError?: (error: unknown, ctx: C15TContext) => void | Promise<void>;
	};
	/**
	 * Hooks
	 */
	hooks?: {
		/**
		 * Before a request is processed
		 */
		before?: AuthMiddleware;
		/**
		 * After a request is processed
		 */
		after?: AuthMiddleware;
	};
}
