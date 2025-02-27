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
import { getStorageAdapter } from './storage/utils';
import { getCookies, createCookieGetter } from './cookies';
import { generateId } from './utils/id';
import { env, isProduction } from './utils/env';
import type { ConsentContext } from './types';
import type { c15tOptions, c15tPlugin } from './types';

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
export const init = async (options: c15tOptions): Promise<ConsentContext> => {
	const storage = await getStorageAdapter(options);
	const plugins = options.plugins || [];
	const internalPlugins = getInternalPlugins(options);
	const logger = createLogger(options.logger);

	const baseURL = getBaseURL(options.baseURL, options.basePath);

	// Set up secret
	const secret =
		options.secret || env.C15T_SECRET || env.CONSENT_SECRET || DEFAULT_SECRET;

	if (secret === DEFAULT_SECRET && isProduction) {
		logger.error(
			'You are using the default secret. Please set `C15T_SECRET` in your environment variables or pass `secret` in your config.'
		);
	}

	// Merge options with plugins
	const finalOptions = {
		...options,
		secret,
		baseURL: baseURL ? new URL(baseURL).origin : '',
		basePath: options.basePath || '/api/consent',
		plugins: plugins.concat(internalPlugins),
	};

	const cookies = getCookies(finalOptions);

	// Set up ID generation function
	const generateIdFunc: ConsentContext['generateId'] = ({ model, size }) => {
		if (typeof finalOptions?.advanced?.generateId === 'function') {
			return finalOptions.advanced.generateId({ model, size });
		}
		return generateId(size || 21);
	};

	// Create context
	const ctx: ConsentContext = {
		appName: finalOptions.appName || 'c15t Consent Manager',
		options: finalOptions,
		trustedOrigins: getTrustedOrigins(finalOptions),
		baseURL: baseURL || '',
		secret,
		logger,
		storage,
		secondaryStorage: finalOptions.secondaryStorage,
		generateId: generateIdFunc,
		consentConfig: {
			expiresIn: finalOptions.consent?.expiresIn || 60 * 60 * 24 * 365, // 1 year
			updateAge: finalOptions.consent?.updateAge || 60 * 60 * 24, // 24 hours
		},
		currentConsent: null,
		newConsent: null,
		setNewConsent(consent) {
			this.newConsent = consent;
		},
		createConsentCookie: createCookieGetter(finalOptions),
	};

	// Initialize plugins
	const { context } = runPluginInit(ctx);
	return context;
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
function runPluginInit(ctx: ConsentContext) {
	let options = ctx.options;
	const plugins = options.plugins || [];
	let context: ConsentContext = ctx;

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
						...(result.context as Partial<ConsentContext>),
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
function getInternalPlugins(options: c15tOptions): c15tPlugin[] {
	const plugins: c15tPlugin[] = [];

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
function getTrustedOrigins(options: c15tOptions): string[] {
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
