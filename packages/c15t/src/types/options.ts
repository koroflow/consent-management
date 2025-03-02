/**
 * c15t Consent Management System Configuration Types
 *
 * This module defines the configuration options for the c15t consent management system.
 * It includes types for setting up storage, API endpoints, cookies, rate limiting,
 * analytics, geo-targeting, plugins, logging, and other advanced features.
 */
import type { Logger } from '../utils/logger';
import type { C15TContext, C15TPlugin } from './index';
import type { C15TMiddleware } from '~/api/call';
import type { Field } from '~/db/core/fields';
import type { DatabaseHook } from '~/db/hooks/types';
import type { DatabaseConfiguration } from '~/db/adapters/kysely-adapter/types';
import type { EntityName } from '~/db/core/types';

/**
 * Base entity configuration shared by all entities
 * Provides common configuration options for database entities
 */
export interface BaseEntityConfig {
	/**
	 * Custom model name for the entity table
	 */
	entityName?: string;
	
	/**
	 * The ID prefix for the entity table
	 * Used to generate unique prefixed IDs
	 */
	entityPrefix?: string;
	
	/**
	 * Custom field names for the entity table
	 */
	fields?: Record<string, string>;
	
	/**
	 * Additional fields for the entity table
	 */
	additionalFields?: Record<string, Field>;
}

/**
 * Entity configuration with standard timestamps
 * Extends base configuration with created/updated timestamp fields
 */
export interface TimestampedEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		createdAt?: string;
		updatedAt?: string;
	};
}

/**
 * Entity configuration for entities with active status
 * Extends timestamped configuration with isActive field
 */
export interface ActiveEntityConfig extends TimestampedEntityConfig {
	fields?: Record<string, string> & {
		createdAt?: string;
		updatedAt?: string;
		isActive?: string;
	};
}

/**
 * Main configuration options for the c15t consent management system
 *
 * This interface provides a comprehensive set of options for configuring
 * all aspects of the consent management system, including core functionality,
 * database settings, UI components, and plugin extensions.
 *
 * @typeParam P - Array of plugin types to be used with this configuration
 *
 * @example
 * ```ts
 * // Basic configuration
 * const config: C15TOptions = {
 *   appName: 'My Application',
 *   baseURL: 'https://example.com',
 *   secret: 'strong-secret-key',
 *   plugins: [geoPlugin, analyticsPlugin]
 * };
 * ```
 */
export interface C15TOptions<P extends C15TPlugin[] = C15TPlugin[]> {
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
	 * Database configuration
	 */
	database?: DatabaseConfiguration;

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
	plugins?: P;

	/**
	 * Logger configuration
	 * Controls how events are logged
	 */
	logger?: Logger;

	/**
	 * allows you to define custom hooks that can be
	 * executed during lifecycle of core database
	 * operations.
	 */
	databaseHooks?: DatabaseHook[];
	/*
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
			 * @link https://github.com/c15t/c15t/blob/main/packages/c15t/src/utils/get-request-ip.ts#L8
			 */
			ipAddressHeaders?: string[];
			/**
			 * Disable ip tracking
			 *
			 * ⚠︎ This is a security risk and it may expose your application to abuse
			 */
			disableIpTracking?: boolean;
			/**
			 * Custom generateId function.
			 *
			 * If not provided, random ids will be generated.
			 * If set to false, the database's auto generated id will be used.
			 */
			generateId?:
				| ((options: {
						model: EntityName;
						size?: number;
				  }) => string)
				| false;
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
		generateId?: (options: { model: EntityName; size?: number }) => string;

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
		before?: C15TMiddleware;
		/**
		 * After a request is processed
		 */
		after?: C15TMiddleware;
	};

	/**
	 * User entity configuration
	 * @default entityName: "user", entityPrefix: "usr"
	 */
	user?: TimestampedEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			isIdentified?: string;
			externalId?: string;
			identityProvider?: string;
			lastIpAddress?: string;
			createdAt?: string;
			updatedAt?: string;
		};
	};

	/**
	 * Purpose entity configuration
	 * @default entityName: "purpose", entityPrefix: "pur"
	 */
	purpose?: ActiveEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			code?: string;
			name?: string;
			description?: string;
			isEssential?: string;
			dataCategory?: string;
			legalBasis?: string;
			isActive?: string;
			createdAt?: string;
			updatedAt?: string;
		};
	};

	/**
	 * Consent policy configuration
	 * @default entityName: "consentPolicy", entityPrefix: "pol"
	 */
	consentPolicy?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			version?: string;
			name?: string;
			effectiveDate?: string;
			expirationDate?: string;
			content?: string;
			contentHash?: string;
			isActive?: string;
			createdAt?: string;
		};
	};

	/**
	 * Domain configuration
	 * @default entityName: "domain", entityPrefix: "dom"
	 */
	domain?: ActiveEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			domain?: string;
			isPattern?: string;
			patternType?: string;
			parentDomainId?: string;
			description?: string;
			isActive?: string;
			createdAt?: string;
			updatedAt?: string;
		};
	};

	/**
	 * Geo location configuration
	 * @default entityName: "geoLocation", entityPrefix: "geo"
	 */
	geoLocation?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			countryCode?: string;
			countryName?: string;
			regionCode?: string;
			regionName?: string;
			regulatoryZones?: string;
			createdAt?: string;
		};
	};

	/**
	 * Consent configuration
	 * @default entityName: "consent", entityPrefix: "cns"
	 */
	consent?: BaseEntityConfig & {
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

		fields?: Record<string, string> & {
			id?: string;
			userId?: string;
			domainId?: string;
			preferences?: string;
			metadata?: string;
			policyId?: string;
			ipAddress?: string;
			region?: string;
			givenAt?: string;
			validUntil?: string;
			isActive?: string;
		};
	};

	/**
	 * Purpose junction configuration
	 * @default entityName: "purposeJunction", entityPrefix: "pjx"
	 */
	purposeJunction?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			consentId?: string;
			purposeId?: string;
			isAccepted?: string;
		};
	};

	/**
	 * Record entity configuration
	 * @default entityName: "record", entityPrefix: "rec"
	 */
	record?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			userId?: string;
			consentId?: string;
			actionType?: string;
			details?: string;
			createdAt?: string;
		};
	};

	/**
	 * Consent geo location configuration
	 * @default entityName: "consentGeoLocation", entityPrefix: "cgl"
	 */
	consentGeoLocation?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			consentId?: string;
			geoLocationId?: string;
			createdAt?: string;
		};
	};

	/**
	 * Withdrawal configuration
	 * @default entityName: "withdrawal", entityPrefix: "wdr"
	 */
	withdrawal?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			consentId?: string;
			revokedAt?: string;
			revocationReason?: string;
			method?: string;
			actor?: string;
			metadata?: string;
			createdAt?: string;
		};

		/**
		 * Prevent multiple withdrawals for the same consent
		 *
		 * If true, a user can only have one withdrawal record per consent,
		 * preventing multiple revocation records for the same consent.
		 * This helps maintain data integrity and clearer consent history.
		 *
		 * @default false
		 */
		preventMultipleWithdrawals?: boolean;
	};

	/**
	 * Audit log configuration
	 * @default entityName: "auditLog", entityPrefix: "log"
	 */
	auditLog?: BaseEntityConfig & {
		fields?: Record<string, string> & {
			id?: string;
			timestamp?: string;
			action?: string;
			userId?: string;
			resourceType?: string;
			resourceId?: string;
			actor?: string;
			changes?: string;
			deviceInfo?: string;
			ipAddress?: string;
			createdAt?: string;
		};
	};
}
