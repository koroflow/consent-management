import type {
	EndpointContext,
	EndpointOptions,
	InputContext,
} from 'better-call';
import type { Adapter, C15TOptions } from './index';
import type { createLogger } from '~/utils';
import type { getConsentTables } from '~/db';
import type { DatabaseHook } from '~/db/hooks/types';
import type { createRegistry } from '~/db/create-registry';
import type { EntityName } from '~/db/core/types';

export type HookEndpointContext<
	TOptions extends EndpointOptions = EndpointOptions,
> = EndpointContext<string, TOptions> &
	Omit<InputContext<string, TOptions>, 'method'> & {
		context: C15TContext & {
			returned?: unknown;
			responseHeaders?: Headers;
		};
		headers?: Headers;
	};

export type GenericEndpointContext<
	TOptions extends EndpointOptions = EndpointOptions,
> = EndpointContext<string, TOptions> & {
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
 * Base context type without plugin-specific extensions
 */
export interface BaseC15TContext {
	appName: string;
	options: C15TOptions;
	trustedOrigins: string[];
	baseURL: string;
	secret: string;
	logger: ReturnType<typeof createLogger>;
	generateId: (options: { model: EntityName; size?: number }) => string;
	consentConfig: {
		enabled: boolean;
		expiresIn: number;
		updateAge: number;
	};
	adapter: Adapter;
	registry: ReturnType<typeof createRegistry>;
	tables: ReturnType<typeof getConsentTables>;
}

/**
 * Extended context type with generic plugin extensions
 */
export type C15TContext<
	TPluginContext extends Record<string, unknown> = Record<string, unknown>,
> = BaseC15TContext & TPluginContext;

/**
 * Helper to extract context with a specific plugin's context type
 */
export type ContextWithPlugin<
	TPluginName extends string,
	TPluginContext extends Record<string, unknown>,
> = C15TContext<Record<TPluginName, TPluginContext>>;
