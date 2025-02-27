/**
 * Plugin System for c15t Consent Management
 *
 * This module defines the plugin system architecture for the c15t consent management system.
 * Plugins provide a way to extend functionality with additional features like analytics,
 * geolocation, custom consent flows, and more.
 */
import type { Endpoint } from 'better-call';
import type { AuthMiddleware } from '~/api/call';
import type { HookEndpointContext } from './context';
import type { LiteralString, DeepPartial } from './helper';
import type { c15tOptions, ConsentContext, EndpointContext } from './index';

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
	id: LiteralString;
	/**
	 * The init function is called when the plugin is initialized.
	 * You can return a new context or modify the existing context.
	 */
	init?: (ctx: ConsentContext) => {
		context?: DeepPartial<Omit<ConsentContext, 'options'>>;
		options?: Partial<c15tOptions>;
	} | void;
	endpoints?: {
		[key: string]: Endpoint;
	};
	middlewares?: {
		path: string;
		middleware: Endpoint;
	}[];
	onRequest?: (
		request: Request,
		ctx: ConsentContext
	) => Promise<
		| {
				response: Response;
		  }
		| {
				request: Request;
		  }
		| void
	>;
	onResponse?: (
		response: Response,
		ctx: ConsentContext
	) => Promise<{
		response: Response;
	} | void>;
	hooks?: {
		before?: {
			matcher: (context: HookEndpointContext) => boolean;
			handler: AuthMiddleware;
		}[];
		after?: {
			matcher: (context: HookEndpointContext) => boolean;
			handler: AuthMiddleware;
		}[];
	};
	/**
	 * The options of the plugin
	 */
	options?: Record<string, any>;
	/**
	 * types to be inferred
	 */
	$Infer?: Record<string, any>;
	/**
	 * The rate limit rules to apply to specific paths.
	 */
	rateLimit?: {
		window: number;
		max: number;
		pathMatcher: (path: string) => boolean;
	}[];
	/**
	 * The error codes returned by the plugin
	 */
	$ERROR_CODES?: Record<string, string>;
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
