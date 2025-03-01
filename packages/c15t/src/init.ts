/**
 * c15t Initialization Module
 *
 * This module handles the initialization of the c15t consent management system.
 * It sets up the consent context, configures storage adapters, initializes plugins,
 * and establishes security settings like secrets and trusted origins.
 *
 * The initialization process includes:
 * - Setting up storage adapters for consent data
 * - Configuring security credentials and trusted origins
 * - Initializing core and custom plugins
 * - Creating the consent context object that serves as the foundation for the system
 *
 * This is an internal module typically not used directly by consumers of the c15t library.
 */
// init.ts
import { defu } from 'defu';
import { createLogger } from './utils/logger';
import { getBaseURL } from './utils/url';
import { generateId } from './utils/id';
import { env, isProduction } from './utils/env';
import type { C15TContext, RegistryContext } from './types/context';
import type { C15TOptions, C15TPlugin } from './types';
import { getConsentTables } from './db';
import { getAdapter } from './db/utils';
import { createRegistry } from './db/create-registry';
import type { ModelName } from './db/core/types';
/**
 * Default secret used when no secret is provided
 * This should only be used in development environments
 */
const DEFAULT_SECRET = 'c15t-default-secret-please-change-in-production';

/**
 * Initializes the c15t consent management system
 *
 * This function creates and configures the consent context based on the provided options.
 * It sets up storage adapters, initializes plugins, configures security settings,
 * and establishes the foundation for the consent management system.
 *
 * @param options - Configuration options for the c15t instance
 * @returns A Promise resolving to the initialized consent context
 *
 * @example
 * ```typescript
 * const contextPromise = init({
 *   secret: process.env.CONSENT_SECRET,
 *   storage: memoryAdapter(),
 *   plugins: [geoPlugin()]
 * });
 *
 * const context = await contextPromise;
 * // Now use the context to handle consent management
 * ```
 */
export const init = async (options: C15TOptions) => {
	// Initialize core components
	const adapter = await getAdapter(options);
	const logger = createLogger(options.logger);
	const baseURL = getBaseURL(options.baseURL, options.basePath);
	const secret =
		options.secret || env.C15T_SECRET || env.CONSENT_SECRET || DEFAULT_SECRET;

	// Secret warning
	if (secret === DEFAULT_SECRET && isProduction) {
		logger.error(
			'Using default secret in production. Set C15T_SECRET or pass secret in config.'
		);
	}

	// Create normalized options
	const finalOptions = {
		...options,
		secret,
		baseURL: baseURL ? new URL(baseURL).origin : '',
		basePath: options.basePath || '/api/c15t',
		plugins: (options.plugins || []).concat(getInternalPlugins(options)),
	};

	// Create ID generator
	const generateIdFunc = ({
		model,
		size,
	}: { model: ModelName; size?: number }) => {
		return (
			finalOptions?.advanced?.generateId?.({ model, size }) ||
			generateId(size || 21)
		);
	};

	// Create registry context - just what registries need
	const registryContext: RegistryContext = {
		adapter,
		options: finalOptions,
		logger,
		hooks: options.databaseHooks || [],
		generateId: generateIdFunc,
	};

	// Create full application context
	const ctx: C15TContext = {
		appName: finalOptions.appName || 'c15t Consent Manager',
		options: finalOptions,
		trustedOrigins: getTrustedOrigins(finalOptions),
		baseURL: baseURL || '',
		secret,
		logger,
		generateId: generateIdFunc,
		consentConfig: {
			expiresIn: finalOptions.consent?.expiresIn || 60 * 60 * 24 * 365,
			updateAge: finalOptions.consent?.updateAge || 60 * 60 * 24,
		},
		adapter,
		registry: createRegistry(registryContext),
		tables: getConsentTables(options),
	};

	// Initialize plugins and return
	return runPluginInit(ctx).context;
};

/**
 * Initializes all registered plugins
 *
 * This function runs the init method of each plugin in sequence,
 * collecting any context or options modifications they provide.
 *
 * @param ctx - The current consent context
 * @returns The updated context after plugin initialization
 */
function runPluginInit(ctx: C15TContext) {
	let options = ctx.options;
	const plugins = options.plugins || [];
	let context: C15TContext = ctx;

	for (const plugin of plugins) {
		if (plugin.init) {
			const result = plugin.init(ctx);
			if (typeof result === 'object') {
				if (result.options) {
					options = defu(options, result.options);
				}
				if (result.context) {
					context = {
						...context,
						...(result.context as Partial<C15TContext>),
					};
				}
			}
		}
	}

	context.options = options;
	return { context };
}

/**
 * Retrieves internal plugins based on configuration options
 *
 * This function determines which internal plugins should be automatically
 * included based on the provided options.
 *
 * @param options - The c15t configuration options
 * @returns An array of internal plugins to include
 */
function getInternalPlugins(options: C15TOptions): C15TPlugin[] {
	const plugins: C15TPlugin[] = [];

	// Add internal plugins based on options
	if (options.advanced?.crossSubDomainCookies?.enabled) {
		// Add cross-subdomain cookie plugin
	}

	// Add analytics plugin if enabled
	if (options.analytics?.enabled !== false) {
		// Add analytics plugin
	}

	return plugins;
}

/**
 * Builds a list of trusted origins for CORS
 *
 * This function determines which origins should be trusted for
 * cross-origin requests based on configuration and environment.
 *
 * @param options - The c15t configuration options
 * @returns An array of trusted origin URLs
 */
function getTrustedOrigins(options: C15TOptions): string[] {
	const baseURL = getBaseURL(options.baseURL, options.basePath);
	if (!baseURL) {
		return [];
	}

	const trustedOrigins = [new URL(baseURL).origin];

	if (options.trustedOrigins && Array.isArray(options.trustedOrigins)) {
		trustedOrigins.push(...options.trustedOrigins);
	}

	const envTrustedOrigins = env.C15T_TRUSTED_ORIGINS;
	if (envTrustedOrigins) {
		trustedOrigins.push(...envTrustedOrigins.split(','));
	}

	return trustedOrigins;
}
