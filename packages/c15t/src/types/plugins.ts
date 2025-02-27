import type { ConsentContext, EndpointContext } from './index';
import type { C15tOptions } from './options';
import type { Endpoint } from '../api/endpoint';


export interface PluginHookContext extends EndpointContext {
	path: string;
	// Add geo property for geo plugin
	geo?: {
		ip: string;
		country?: string;
		region?: string;
		source: string;
	};
}

export interface PluginHook {
	/**
	 * A function to determine if this hook should run for the current request
	 */
	matcher: (context: PluginHookContext) => boolean;

	/**
	 * The hook handler that runs if matcher returns true
	 */
	handler: (context: PluginHookContext) => Promise<void> | void;
}

export interface C15tPlugin {
	/**
	 * Unique plugin identifier
	 */
	id: string;

	/**
	 * Plugin initialization function
	 */
	init?: (context: ConsentContext) => {
		context?: Partial<ConsentContext>;
		options?: Partial<C15tOptions>;
	} | void;

	/**
	 * Additional API endpoints provided by the plugin
	 */
	endpoints?: Record<string, Endpoint>;

	/**
	 * Plugin schema extensions
	 */
	schema?: any;

	/**
	 * Plugin hooks
	 */
	hooks?: {
		/**
		 * Hooks that run before an endpoint handler
		 */
		before?: PluginHook[];

		/**
		 * Hooks that run after an endpoint handler but before sending the response
		 */
		after?: PluginHook[];
	};

	/**
	 * Error codes defined by this plugin
	 */
	$ERROR_CODES?: Record<string, string>;

	/**
	 * Type inference helpers for this plugin
	 */
	$InferServerPlugin?: any;
}

export type InferPluginOptions<T extends C15tPlugin> = T extends {
	options: infer O;
}
	? O
	: Record<string, never>;
