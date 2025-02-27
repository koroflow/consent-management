import type { Storage } from './storage';
import type { C15tPlugin } from './plugins';
import type { LogLevel } from '../utils/logger';

export interface C15tOptions {
	/**
	 * The base URL for the API (optional if running in a browser)
	 */
	baseURL?: string;

	/**
	 * The base path for API endpoints
	 * @default "/api/consent"
	 */
	basePath?: string;

	/**
	 * Storage provider for consent data
	 */
	storage: Storage;

	/**
	 * Secondary storage for distributed environments (optional)
	 */
	secondaryStorage?: Storage;

	/**
	 * Application name shown in consent dialogs
	 */
	appName?: string;

	/**
	 * Secret used for signing cookies and tokens
	 */
	secret?: string;

	/**
	 * Enable CORS support
	 * @default true
	 */
	cors?: boolean;

	/**
	 * Trusted origins for CORS
	 */
	trustedOrigins?: string[] | ((request: Request) => string[]);

	/**
	 * Consent configuration options
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
		 */
		cookieStorage?: {
			enabled: boolean;
			/**
			 * How long to cache consent data in the cookie
			 * @default 600 (10 minutes)
			 */
			maxAge?: number;
			/**
			 * Cookie domain configuration
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
	 */
	cookies?: {
		/**
		 * Prefix for cookie names
		 * @default "c15t"
		 */
		prefix?: string;

		/**
		 * Domain for cookies
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
	 * Rate limiting configuration
	 */
	rateLimit?: {
		/**
		 * Enable rate limiting
		 * @default true in production
		 */
		enabled?: boolean;

		/**
		 * Time window in seconds
		 * @default 60
		 */
		window?: number;

		/**
		 * Max requests per window
		 * @default 100
		 */
		max?: number;

		/**
		 * Storage for rate limiting
		 * @default "memory"
		 */
		storage?: 'memory' | 'secondary-storage';
	};

	/**
	 * Analytics configuration
	 */
	analytics?: {
		/**
		 * Enable analytics
		 * @default true
		 */
		enabled?: boolean;

		/**
		 * Destinations for analytics data
		 */
		destinations?: Array<{
			type: string;
			options: Record<string, any>;
		}>;
	};

	/**
	 * Geo-targeting configuration
	 */
	geo?: {
		/**
		 * Enable geo-targeting
		 * @default true
		 */
		enabled?: boolean;

		/**
		 * Additional geo configuration options
		 */
		[key: string]: any;
	};

	/**
	 * Plugins to extend functionality
	 */
	plugins?: C15tPlugin[];

	/**
	 * Logger configuration
	 */
	logger?: {
		/**
		 * Minimum level to log
		 * @default "info" in production, "debug" in development
		 */
		level?: LogLevel;

		/**
		 * Custom logger implementation
		 */
		custom?: {
			debug: (message: string, meta?: any) => void;
			info: (message: string, meta?: any) => void;
			warn: (message: string, meta?: any) => void;
			error: (message: string, meta?: any) => void;
		};
	};

	/**
	 * Advanced configuration options
	 */
	advanced?: {
		/**
		 * Function to generate IDs
		 */
		generateId?: (options: { model: string; size?: number }) => string;

		/**
		 * Support for cross-subdomain cookies
		 */
		crossSubDomainCookies?: {
			enabled: boolean;
			domain?: string;
		};
	};
}
