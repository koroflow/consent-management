import type { EndpointContext, InputContext } from 'better-call';
import type { Adapter, C15TOptions } from './index';
import type { createLogger } from '~/utils';
import type { getConsentTables } from '~/db';
import type { DatabaseHook } from '~/db/hooks/types';
import type { createRegistry } from '~/db/create-registry';
import type { EntityName } from '~/db/core/types';

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

// Base context interface - shared by all components
export interface BaseContext {
	options: C15TOptions;
	logger: ReturnType<typeof createLogger>;
}

// Registry context specifically for adapters
export interface RegistryContext extends BaseContext {
	adapter: Adapter;
	hooks: DatabaseHook[];
	generateId: (options: { model: EntityName; size?: number }) => string;
}

/**
 * Context interface for the consent system
 *
 * This is the main context object passed around throughout the system
 * and made available to plugins and endpoint handlers
 */
export interface C15TContext extends BaseContext {
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
	generateId: (options: { model: EntityName; size?: number }) => string;

	// API methods
	/**
	 * API version
	 */
	version?: string;

	tables: ReturnType<typeof getConsentTables>;
}
