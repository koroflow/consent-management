// init.ts
import { defu } from 'defu';
import { createLogger } from './utils/logger';
import { getBaseURL } from './utils/url';
import { getStorageAdapter } from './storage/utils';
import { getCookies, createCookieGetter } from './cookies';
import { generateId } from './utils/id';
import { env, isProduction } from './utils/env';
import type { ConsentContext, ConsentRecord } from './types';
import type { C15tOptions, C15tPlugin } from './types';

const DEFAULT_SECRET = 'c15t-default-secret-please-change-in-production';

export const init = async (options: C15tOptions): Promise<ConsentContext> => {
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
	options = {
		...options,
		secret,
		baseURL: baseURL ? new URL(baseURL).origin : '',
		basePath: options.basePath || '/api/consent',
		plugins: plugins.concat(internalPlugins),
	};

	const cookies = getCookies(options);

	// Set up ID generation function
	const generateIdFunc: ConsentContext['generateId'] = ({ model, size }) => {
		if (typeof options?.advanced?.generateId === 'function') {
			return options.advanced.generateId({ model, size });
		}
		return generateId(size || 21);
	};

	// Create context
	const ctx: ConsentContext = {
		appName: options.appName || 'C15t Consent Manager',
		options,
		trustedOrigins: getTrustedOrigins(options),
		baseURL: baseURL || '',
		secret,
		logger,
		storage,
		secondaryStorage: options.secondaryStorage,
		generateId: generateIdFunc,
		consentConfig: {
			expiresIn: options.consent?.expiresIn || 60 * 60 * 24 * 365, // 1 year
			updateAge: options.consent?.updateAge || 60 * 60 * 24, // 24 hours
		},
		currentConsent: null,
		newConsent: null,
		setNewConsent(consent) {
			this.newConsent = consent;
		},
		createConsentCookie: createCookieGetter(options),
	};

	// Initialize plugins
	let { context } = runPluginInit(ctx);
	return context;
};

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

function getInternalPlugins(options: C15tOptions): C15tPlugin[] {
	const plugins: C15tPlugin[] = [];

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

function getTrustedOrigins(options: C15tOptions): string[] {
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