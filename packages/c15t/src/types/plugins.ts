/**
 * Plugin System for c15t Consent Management
 *
 * This module defines the plugin system architecture for the c15t consent management system.
 * Plugins provide a way to extend functionality with additional features like analytics,
 * geolocation, custom consent flows, and more.
 */
import type { Endpoint } from 'better-call';
import type { AuthMiddleware } from '~/api/call';

import type {
	C15TOptions,
	C15TContext,
	HookEndpointContext,
	LiteralString,
	DeepPartial,
} from './index';
import type { FieldAttribute } from '~/db/fields';
import type { Migration } from 'kysely';

/**
 * Context object provided to plugin hooks
 *
 * This extends the standard endpoint context with additional properties
 * specific to plugin hooks, such as the request path and geolocation data.
 */
export interface PluginHookContext {
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
 * c15t Plugin Definition
 *
 * This interface defines the structure of a plugin for the c15t consent management system.
 * Plugins can add endpoints, hooks, error codes, and custom functionality.
 *
 * @example
 * ```typescript
 * const myPlugin: C15TPlugin = {
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
export interface C15TPlugin {
	id: LiteralString;
	/**
	 * The init function is called when the plugin is initialized.
	 * You can return a new context or modify the existing context.
	 */
	init?: (ctx: C15TContext) =>
		| {
				context?: DeepPartial<Omit<C15TContext, 'options'>>;
				options?: Partial<C15TOptions>;
		  }
		| undefined;
	endpoints?: {
		[key: string]: Endpoint;
	};
	middlewares?: {
		path: string;
		middleware: Endpoint;
	}[];
	onRequest?: (
		request: Request,
		ctx: C15TContext
	) => Promise<
		| {
				response: Response;
		  }
		| {
				request: Request;
		  }
		| undefined
	>;
	onResponse?: (
		response: Response,
		ctx: C15TContext
	) => Promise<
		| {
				response: Response;
		  }
		| undefined
	>;
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
	 * Schema the plugin needs
	 *
	 * This will also be used to migrate the database. If the fields are dynamic from the plugins
	 * configuration each time the configuration is changed a new migration will be created.
	 *
	 * NOTE: If you want to create migrations manually using
	 * migrations option or any other way you
	 * can disable migration per table basis.
	 *
	 * @example
	 * ```ts
	 * schema: {
	 * 	user: {
	 * 		fields: {
	 * 			email: {
	 * 				 type: "string",
	 * 			},
	 * 			emailVerified: {
	 * 				type: "boolean",
	 * 				defaultValue: false,
	 * 			},
	 * 		},
	 * 	}
	 * } as AuthPluginSchema
	 * ```
	 */
	schema?: C15TPluginSchema;
	/**
	 * The migrations of the plugin. If you define schema that will automatically create
	 * migrations for you.
	 *
	 * ⚠️ Only uses this if you dont't want to use the schema option and you disabled migrations for
	 * the tables.
	 */
	migrations?: Record<string, Migration>;
	/**
	 * The options of the plugin
	 */
	options?: Record<string, unknown>;
	/**
	 * types to be inferred
	 */
	$Infer?: Record<string, unknown>;

	/**
	 * The error codes returned by the plugin
	 */
	$ERROR_CODES?: Record<string, string>;
}

/**
 * Infer plugin types from configuration options
 *
 * This type utility extracts the plugin types from a configuration object,
 * allowing TypeScript to understand the extensions provided by plugins.
 */
export type InferPluginTypes<O extends C15TOptions> =
	O['plugins'] extends Array<infer P>
		? P extends C15TPlugin
			? P extends { $InferServerPlugin: infer SP }
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
export type InferPluginErrorCodes<O extends C15TOptions> =
	O['plugins'] extends Array<infer P>
		? P extends C15TPlugin
			? P['$ERROR_CODES'] extends infer EC
				? EC extends Record<string, unknown>
					? EC
					: Record<string, never>
				: Record<string, never>
			: Record<string, never>
		: Record<string, never>;

/**
 * Schema type for plugin extensions
 *
 * This can include additional types, validation schemas, or other
 * schema-related extensions provided by plugins.
 */
export type C15TPluginSchema = {
	[table in string]: {
		fields: {
			[field in string]: FieldAttribute;
		};
		disableMigration?: boolean;
		modelName?: string;
	};
};
