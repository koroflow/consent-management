import type { EndpointContext, InputContext } from 'better-call';
import type { Adapter, C15TOptions } from './index';
import type { createLogger } from '~/utils';
import type { createRegistry, getConsentTables } from '~/db';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type HookEndpointContext = EndpointContext<string, any> &
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	Omit<InputContext<string, any>, 'method'> & {
		context: C15TContext & {
			returned?: unknown;
			responseHeaders?: Headers;
		};
		headers?: Headers;
	};

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type GenericEndpointContext = EndpointContext<string, any> & {
	context: C15TContext;
};

/**
 * Context interface for the consent system
 *
 * This is the main context object passed around throughout the system
 * and made available to plugins and endpoint handlers
 */
export interface C15TContext {
	/**
	 * Configuration options
	 */
	options: C15TOptions;

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

	adapter: Adapter;
	registry: ReturnType<typeof createRegistry>;

	/**
	 * Secret for signing cookies and tokens
	 */
	secret: string;

	/**
	 * Logger interface
	 */
	logger: ReturnType<typeof createLogger>;

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

	// API methods
	/**
	 * API version
	 */
	version?: string;

	tables: ReturnType<typeof getConsentTables>;
}
