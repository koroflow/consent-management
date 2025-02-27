// plugins/analytics/index.ts
import { createEndpoint } from '../../api/endpoint';
import type { C15tPlugin, ConsentContext, EndpointContext } from '../../types';

export const ERROR_CODES = {
	ANALYTICS_DISABLED: 'analytics_disabled',
	INVALID_PROVIDER: 'invalid_provider',
	MISSING_CONSENT: 'missing_consent',
} as const;

export interface AnalyticsPluginOptions {
	/**
	 * Enable data collection
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Analytics providers
	 */
	providers?: Array<{
		/**
		 * Provider identifier
		 */
		id: string;

		/**
		 * Display name
		 */
		name: string;

		/**
		 * Provider URL
		 */
		url?: string;

		/**
		 * Required consent purpose ID
		 */
		purposeId: string;

		/**
		 * Provider-specific configuration
		 */
		config?: Record<string, any>;
	}>;

	/**
	 * Allow server-side analytics
	 * @default true
	 */
	serverSide?: boolean;

	/**
	 * Allow client-side analytics
	 * @default true
	 */
	clientSide?: boolean;
}

export const analytics = (options?: AnalyticsPluginOptions): C15tPlugin => {
	// Fallback to empty array if providers is undefined
	const providers = options?.providers || [];

	return {
		id: 'analytics',

		$ERROR_CODES: ERROR_CODES,

		init(context: ConsentContext) {
			// Default options
			const finalOptions = {
				enabled: options?.enabled !== false,
				serverSide: options?.serverSide !== false,
				clientSide: options?.clientSide !== false,
				providers: providers,
			};

			// Add to global options
			context.options.analytics = {
				...context.options.analytics,
				...finalOptions,
			};

			// Register purposes for analytics providers
			if (finalOptions.enabled && providers.length > 0) {
				context.storage
					.listPurposes()
					.then((purposes) => {
						const existingPurposeIds = new Set(purposes.map((p) => p.id));

						// Create analytics purposes if they don't exist
						for (const provider of providers) {
							if (!existingPurposeIds.has(provider.purposeId)) {
								context.logger.info(
									`Creating purpose for analytics provider: ${provider.name}`
								);

								context.storage
									.createPurpose({
										id: provider.purposeId,
										name: `${provider.name} Analytics`,
										description: `Allow ${provider.name} to collect usage data to improve the service`,
										required: false,
										default: false,
										legalBasis: 'consent',
									})
									.catch((error) => {
										context.logger.error(
											`Failed to create purpose for ${provider.name}`,
											error
										);
									});
							}
						}
					})
					.catch((err) => {
						context.logger.error('Error initializing analytics purposes:', err);
					});
			}
		},

		endpoints: {
			track: createEndpoint(
				async (ctx: EndpointContext) => {
					// Check if analytics is enabled
					if (ctx.context.options.analytics?.enabled === false) {
						return ctx.json(
							{
								success: false,
								message: ERROR_CODES.ANALYTICS_DISABLED,
							},
							{ status: 403 }
						);
					}

					// Find the provider
					const provider = providers.find((p) => p.id === ctx.body.provider);
					if (!provider) {
						return ctx.json(
							{
								success: false,
								message: ERROR_CODES.INVALID_PROVIDER,
							},
							{ status: 400 }
						);
					}

					// Get the consent record
					const consentToken = await ctx.getSignedCookie(
						ctx.context.options.cookies?.prefix + '.consent_token' ||
							'c15t.consent_token',
						ctx.context.secret
					);

					if (consentToken) {
						const consent = await ctx.context.storage.getConsent(consentToken);

						// Check if consent is given for this provider
						if (!consent || !consent.preferences[provider.purposeId]) {
							return ctx.json(
								{
									success: false,
									message: ERROR_CODES.MISSING_CONSENT,
								},
								{ status: 403 }
							);
						}

						// Log the event
						ctx.context.logger.info('Analytics event', {
							event: ctx.body.event,
							provider: ctx.body.provider,
							properties: ctx.body.properties,
							userId: consent.userId,
							deviceId: consent.deviceId,
						});

						// Here you would integrate with actual analytics services
						// This is just a placeholder

						return ctx.json({ success: true });
					}

					return ctx.json(
						{
							success: false,
							message: ERROR_CODES.MISSING_CONSENT,
						},
						{ status: 403 }
					);
				},
				{
					method: 'POST',
					requiresConsent: true,
				}
			),

			getProviders: createEndpoint(
				async (ctx: EndpointContext) => {
					// Return configured analytics providers (without sensitive config)
					const providersList = providers.map((provider) => ({
						id: provider.id,
						name: provider.name,
						url: provider.url,
						purposeId: provider.purposeId,
						// Don't return sensitive config details
					}));

					return ctx.json(providersList);
				},
				{
					method: 'GET',
				}
			),
		},
	};
};

// Client plugin
export const analyticsClient = () => {
	return {
		id: 'analytics',
		methods: {
			track: async function (
				this: any,
				event: string,
				provider: string,
				properties?: Record<string, any>
			) {
				return this.$fetch('/analytics/track', {
					method: 'POST',
					body: {
						event,
						provider,
						properties,
					},
				});
			},

			getProviders: async function (this: any) {
				return this.$fetch('/analytics/providers', {
					method: 'GET',
				});
			},
		},
	};
};
