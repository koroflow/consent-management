/**
 * Plugin System for c15t Consent Management
 *
 * This module defines the plugin system architecture for the c15t consent management system.
 * Plugins provide a way to extend functionality with additional features like analytics,
 * geolocation, custom consent flows, and more.
 */
import type { ConsentContext, EndpointContext } from './index';
import type { c15tOptions } from './options';
import type { ConsentEndpoint } from '../api/call';

/**
 * Context object provided to plugin hooks
 *
 * This extends the standard endpoint context with additional properties
 * specific to plugin hooks, such as the request path and geolocation data.
 */
export interface PluginHookContext extends EndpointContext {
	/**
	 * The path of the current request
	 */
	path: string;

	/**
	 * Geolocation information (added by the geo plugin)
	 */
	geo?: {
		/**
		 * IP address of the request
		 */
		ip: string;

		/**
		 * Country code (ISO 3166-1 alpha-2)
		 */
		country?: string;

		/**
		 * Region or state code
		 */
		region?: string;

		/**
		 * Source of the geolocation data
		 */
		source: string;
	};
}

/**
 * Plugin hook definition
 *
 * Hooks are used to run custom logic at specific points in the request lifecycle.
 * Each hook includes a matcher function to determine when it should run and
 * a handler function that contains the actual logic.
 */
export interface PluginHook {
	/**
	 * A function to determine if this hook should run for the current request
	 *
	 * @param context - The hook context with request details
	 * @returns True if the hook should run, false otherwise
	 */
	matcher: (context: PluginHookContext) => boolean;

	/**
	 * The hook handler that runs if matcher returns true
	 *
	 * @param context - The hook context with request details
	 * @returns A Promise that resolves when the hook completes, or void
	 */
	handler: (context: PluginHookContext) => Promise<void> | void;
}

/**
 * Schema type for plugin extensions
 *
 * This can include additional types, validation schemas, or other
 * schema-related extensions provided by plugins.
 */
export type PluginSchema = Record<string, unknown>;

/**
 * Type for plugin-specific server-side functionality
 */
export type PluginServerExtension = Record<string, unknown>;

/**
 * c15t Plugin Definition
 *
 * This interface defines the structure of a plugin for the c15t consent management system.
 * Plugins can add endpoints, hooks, error codes, and custom functionality.
 *
 * @example
 * ```typescript
 * const myPlugin: c15tPlugin = {
 *   id: 'my-plugin',
 *   init: (context) => {
 *     // Initialize plugin
 *   },
 *   endpoints: {
 *     myEndpoint: createEndpoint('/my-endpoint', async (ctx) => {
 *       return ctx.json({ success: true });
 *     })
 *   }
 * };
 * ```
 */
export interface c15tPlugin {
	/**
	 * Unique plugin identifier
	 * This ID should be unique across all plugins in the system
	 */
	id: string;

	/**
	 * Plugin initialization function
	 * Called when the plugin is first registered with the system
	 *
	 * @param context - The consent system context
	 * @returns Optional context and options updates, or nothing
	 */
	init?: (context: ConsentContext) =>
		| {
				context?: Partial<ConsentContext>;
				options?: Partial<c15tOptions>;
		  }
		| undefined;

	/**
	 * Additional API endpoints provided by the plugin
	 * These endpoints are registered with the API and can be called by clients
	 */
	endpoints?: Record<string, ConsentEndpoint>;

	/**
	 * Plugin schema extensions
	 * Can include additional types, validation schemas, or other schema-related extensions
	 */
	schema?: PluginSchema;

	/**
	 * Plugin hooks
	 * Hooks run at specific points in the request lifecycle
	 */
	hooks?: {
		/**
		 * Hooks that run before an endpoint handler
		 * These can modify the request or perform authorization checks
		 */
		before?: PluginHook[];

		/**
		 * Hooks that run after an endpoint handler but before sending the response
		 * These can modify the response or perform logging
		 */
		after?: PluginHook[];
	};

	/**
	 * Error codes defined by this plugin
	 * These are used to standardize error responses
	 */
	$ERROR_CODES?: Record<string, string>;

	/**
	 * Type inference helpers for this plugin
	 * Used for TypeScript type inference of plugin extensions
	 */
	$InferServerPlugin?: PluginServerExtension;
}

/**
 * Type utility to extract options type from a plugin
 *
 * @template T - Plugin type
 */
export type InferPluginOptions<T extends c15tPlugin> = T extends {
	options: infer O;
}
	? O
	: Record<string, never>;
