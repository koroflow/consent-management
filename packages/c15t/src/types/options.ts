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
	 * Database table configuration
	 * Allows customizing table and field names
	 */
	user?: {
		/**
		 * Custom model name for user table
		 * @default "user"
		 */
		entityName?: string;
		/**
		 * Custom field names for user table
		 */
		fields?: {
			id?: string;
			isIdentified?: string;
			externalId?: string;
			identityProvider?: string;
			lastIpAddress?: string;
			createdAt?: string;
			updatedAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the user table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent purpose configuration
	 */
	purpose?: {
		/**
		 * Custom model name for consent purpose table
		 * @default "purpose"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent purpose table
		 */
		fields?: {
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
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent purpose table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent policy configuration
	 */
	consentPolicy?: {
		/**
		 * Custom model name for consent policy table
		 * @default "consentPolicy"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent policy table
		 */
		fields?: {
			id?: string;
			version?: string;
			name?: string;
			effectiveDate?: string;
			expirationDate?: string;
			content?: string;
			contentHash?: string;
			isActive?: string;
			createdAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent policy table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Domain configuration
	 */
	domain?: {
		/**
		 * Custom model name for domain table
		 * @default "domain"
		 */
		entityName?: string;
		/**
		 * Custom field names for domain table
		 */
		fields?: {
			id?: string;
			domain?: string;
			isPattern?: string;
			patternType?: string;
			parentDomainId?: string;
			description?: string;
			isActive?: string;
			createdAt?: string;
			updatedAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the domain table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Geo location configuration
	 */
	geoLocation?: {
		/**
		 * Custom model name for geo location table
		 * @default "geoLocation"
		 */
		entityName?: string;
		/**
		 * Custom field names for geo location table
		 */
		fields?: {
			id?: string;
			countryCode?: string;
			countryName?: string;
			regionCode?: string;
			regionName?: string;
			regulatoryZones?: string;
			createdAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the geo location table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent fields configuration
	 * Extends the consent configuration with database fields
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

		/**
		 * Custom model name for consent table
		 * @default "consent"
		 */
		entityName?: string;

		/**
		 * Custom field names for consent table
		 */
		fields?: {
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
			[key: string]: string | undefined;
		};

		/**
		 * Additional fields for the consent table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent purpose junction configuration
	 */
	purposeJunction?: {
		/**
		 * Custom model name for consent purpose junction table
		 * @default "purposeJunction"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent purpose junction table
		 */
		fields?: {
			id?: string;
			consentId?: string;
			purposeId?: string;
			isAccepted?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent purpose junction table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent record configuration
	 */
	record?: {
		/**
		 * Custom model name for consent record table
		 * @default "record"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent record table
		 */
		fields?: {
			id?: string;
			consentId?: string;
			recordType?: string;
			recordTypeDetail?: string;
			content?: string;
			ipAddress?: string;
			recordMetadata?: string;
			createdAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent record table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent geo location configuration
	 */
	consentGeoLocation?: {
		/**
		 * Custom model name for consent geo location table
		 * @default "consentGeoLocation"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent geo location table
		 */
		fields?: {
			id?: string;
			consentId?: string;
			geoLocationId?: string;
			createdAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent geo location table
		 */
		additionalFields?: Record<string, Field>;
	};

	/**
	 * Consent withdrawal configuration
	 */
	withdrawal?: {
		/**
		 * Custom model name for consent withdrawal table
		 * @default "withdrawal"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent withdrawal table
		 */
		fields?: {
			id?: string;
			consentId?: string;
			revokedAt?: string;
			revocationReason?: string;
			method?: string;
			actor?: string;
			metadata?: string;
			createdAt?: string;
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent withdrawal table
		 */
		additionalFields?: Record<string, Field>;

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
	 * Consent audit log configuration
	 */
	auditLog?: {
		/**
		 * Custom model name for consent audit log table
		 * @default "auditLog"
		 */
		entityName?: string;
		/**
		 * Custom field names for consent audit log table
		 */
		fields?: {
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
			[key: string]: string | undefined;
		};
		/**
		 * Additional fields for the consent audit log table
		 */
		additionalFields?: Record<string, Field>;
	};
}
