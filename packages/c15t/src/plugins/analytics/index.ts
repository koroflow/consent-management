// /**
//  * Analytics Plugin for c15t
//  *
//  * This plugin provides analytics tracking capabilities with consent management.
//  * It allows tracking events for different analytics providers while ensuring
//  * proper user consent has been given for each provider.
//  *
//  * The plugin supports multiple analytics providers, each with their own
//  * purpose ID for consent. It automatically registers consent purposes
//  * for configured providers during initialization.
//  *
//  * @example
//  * ```typescript
//  * import { analytics, analyticsClient } from '@c15t/plugins/analytics';
//  *
//  * // Server-side setup
//  * const c15t = createc15t({
//  *   plugins: [
//  *     analytics({
//  *       providers: [
//  *         {
//  *           id: 'google-analytics',
//  *           name: 'Google Analytics',
//  *           purposeId: 'analytics',
//  *           url: 'https://analytics.google.com'
//  *         }
//  *       ]
//  *     })
//  *   ]
//  * });
//  *
//  * // Client-side usage
//  * const client = createc15tClient({
//  *   plugins: [analyticsClient()]
//  * });
//  *
//  * // Track an event if user has consented
//  * client.analytics.track('page_view', 'google-analytics');
//  * ```
//  */
// import { createEndpoint } from 'better-call';
// import type {
// 	C15TPlugin,
// 	LoggerMetadata,
// 	C15TContext,
// 	EndpointContext,
// } from '~/types';

// /**
//  * Error codes specific to the analytics plugin
//  */
// export const ERROR_CODES = {
// 	/**
// 	 * Analytics functionality is disabled in configuration
// 	 */
// 	ANALYTICS_DISABLED: 'analytics_disabled',

// 	/**
// 	 * The requested analytics provider is not configured
// 	 */
// 	INVALID_PROVIDER: 'invalid_provider',

// 	/**
// 	 * Missing required consent for the analytics provider
// 	 */
// 	MISSING_CONSENT: 'missing_consent',
// } as const;

// /**
//  * Configuration type for an analytics provider
//  */
// interface AnalyticsProvider {
// 	/**
// 	 * Unique identifier for the provider
// 	 */
// 	id: string;

// 	/**
// 	 * Display name for the provider
// 	 */
// 	name: string;

// 	/**
// 	 * Provider website or documentation URL
// 	 */
// 	url?: string;

// 	/**
// 	 * Consent purpose ID required for this provider
// 	 */
// 	purposeId: string;

// 	/**
// 	 * Provider-specific configuration
// 	 */
// 	config?: Record<string, unknown>;
// }

// /**
//  * Properties that can be included with an analytics event
//  */
// type EventProperties = Record<
// 	string,
// 	string | number | boolean | null | undefined
// >;

// /**
//  * Configuration options for the analytics plugin
//  */
// export interface AnalyticsPluginOptions {
// 	/**
// 	 * Enable data collection
// 	 * @default true
// 	 */
// 	enabled?: boolean;

// 	/**
// 	 * Analytics providers configuration
// 	 * Each provider must have a unique ID and purpose ID for consent
// 	 */
// 	providers?: Array<AnalyticsProvider>;

// 	/**
// 	 * Allow server-side analytics collection
// 	 * @default true
// 	 */
// 	serverSide?: boolean;

// 	/**
// 	 * Allow client-side analytics collection
// 	 * @default true
// 	 */
// 	clientSide?: boolean;
// }

// /**
//  * Type definition for request body of tracking endpoint
//  */
// interface TrackRequestBody {
// 	event: string;
// 	provider: string;
// 	properties?: EventProperties;
// }

// /**
//  * Create an analytics plugin instance
//  *
//  * This plugin enables analytics tracking with consent management, supporting
//  * multiple providers with separate consent purposes.
//  *
//  * @param options - Configuration options for the analytics plugin
//  * @returns A configured analytics plugin
//  */
// export const analytics = (options?: AnalyticsPluginOptions): C15TPlugin => {
// 	// Fallback to empty array if providers is undefined
// 	const providers = options?.providers || [];

// 	return {
// 		id: 'analytics',

// 		$ERROR_CODES: ERROR_CODES,

// 		/**
// 		 * Initialize the analytics plugin
// 		 *
// 		 * This method sets up the analytics configuration and registers
// 		 * consent purposes for each configured provider.
// 		 *
// 		 * @param context - The consent context
// 		 * @returns Object containing any modifications to the context or options
// 		 */
// 		init(context: C15TContext) {
// 			// Default options
// 			const finalOptions = {
// 				enabled: options?.enabled !== false,
// 				serverSide: options?.serverSide !== false,
// 				clientSide: options?.clientSide !== false,
// 				providers: providers,
// 			};

// 			// Add to global options
// 			context.options.analytics = {
// 				...context.options.analytics,
// 				...finalOptions,
// 			};

// 			// Register purposes for analytics providers
// 			if (finalOptions.enabled && providers.length > 0) {
// 				context.storage
// 					.listPurposes()
// 					.then((purposes) => {
// 						const existingPurposeIds = new Set(purposes.map((p) => p.id));

// 						// Create analytics purposes if they don't exist
// 						for (const provider of providers) {
// 							if (!existingPurposeIds.has(provider.purposeId)) {
// 								context.logger.info(
// 									`Creating purpose for analytics provider: ${provider.name}`
// 								);

// 								context.storage
// 									.createPurpose({
// 										id: provider.purposeId,
// 										name: `${provider.name} Analytics`,
// 										description: `Allow ${provider.name} to collect usage data to improve the service`,
// 										required: false,
// 										default: false,
// 										legalBasis: 'consent',
// 									})
// 									.catch((error) => {
// 										context.logger.error(
// 											`Failed to create purpose for ${provider.name}`,
// 											error
// 										);
// 									});
// 							}
// 						}
// 					})
// 					.catch((err) => {
// 						context.logger.error('Error initializing analytics purposes:', err);
// 					});
// 			}

// 			// Return an object that satisfies the expected return type
// 			return {
// 				options: {
// 					analytics: finalOptions,
// 				},
// 			};
// 		},

// 		endpoints: {
// 			/**
// 			 * Endpoint for tracking analytics events
// 			 */
// 			track: createEndpoint(
// 				'/track',
// 				{
// 					method: 'POST',
// 					requiresConsent: true,
// 					schema: {
// 						description: 'Track an analytics event for a specific provider',
// 						requestBody: {
// 							content: {
// 								'application/json': {
// 									schema: {
// 										type: 'object',
// 										required: ['event', 'provider'],
// 										properties: {
// 											event: {
// 												type: 'string',
// 												description: 'Event name to track',
// 											},
// 											provider: {
// 												type: 'string',
// 												description: 'ID of the analytics provider',
// 											},
// 											properties: {
// 												type: 'object',
// 												description: 'Additional event properties',
// 											},
// 										},
// 									},
// 								},
// 							},
// 						},
// 						responses: {
// 							'200': {
// 								description: 'Event tracked successfully',
// 								content: {
// 									'application/json': {
// 										schema: {
// 											type: 'object',
// 											properties: {
// 												success: {
// 													type: 'boolean',
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 							'400': {
// 								description: 'Invalid provider ID',
// 								content: {
// 									'application/json': {
// 										schema: {
// 											type: 'object',
// 											properties: {
// 												success: {
// 													type: 'boolean',
// 													example: false,
// 												},
// 												message: {
// 													type: 'string',
// 													example: 'invalid_provider',
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 							'403': {
// 								description: 'Analytics disabled or missing consent',
// 								content: {
// 									'application/json': {
// 										schema: {
// 											type: 'object',
// 											properties: {
// 												success: {
// 													type: 'boolean',
// 													example: false,
// 												},
// 												message: {
// 													type: 'string',
// 													enum: ['analytics_disabled', 'missing_consent'],
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 						},
// 					},
// 				},
// 				async (ctx) => {
// 					const context = (ctx as unknown as EndpointContext).context;
// 					// Check if analytics is enabled
// 					if (context.options.analytics?.enabled === false) {
// 						return ctx.json(
// 							{
// 								success: false,
// 								message: ERROR_CODES.ANALYTICS_DISABLED,
// 							},
// 							{ status: 403 }
// 						);
// 					}

// 					// Type assertion for request body
// 					const requestBody = ctx.body as unknown;
// 					// Validate the structure before using it
// 					const body = requestBody as TrackRequestBody;
// 					if (
// 						!body ||
// 						typeof body.event !== 'string' ||
// 						typeof body.provider !== 'string'
// 					) {
// 						return ctx.json(
// 							{
// 								success: false,
// 								message: 'Invalid request format',
// 							},
// 							{ status: 400 }
// 						);
// 					}

// 					// Find the provider
// 					const provider = providers.find((p) => p.id === body.provider);
// 					if (!provider) {
// 						return ctx.json(
// 							{
// 								success: false,
// 								message: ERROR_CODES.INVALID_PROVIDER,
// 							},
// 							{ status: 400 }
// 						);
// 					}

// 					// Get the consent record
// 					const consentToken = await ctx.getSignedCookie(
// 						`${context.options.cookies?.prefix || 'c15t'}.consent_token`,
// 						context.secret
// 					);

// 					if (consentToken) {
// 						const consent = await context.storage.getConsent(consentToken);

// 						// Check if consent is given for this provider
// 						if (!consent || !consent.preferences[provider.purposeId]) {
// 							return ctx.json(
// 								{
// 									success: false,
// 									message: ERROR_CODES.MISSING_CONSENT,
// 								},
// 								{ status: 403 }
// 							);
// 						}

// 						// Log the event with properly typed logging metadata
// 						const logData = {
// 							event: body.event,
// 							provider: body.provider,
// 							properties: body.properties || {},
// 							userId: consent.userId,
// 							deviceId: consent.deviceId,
// 						};

// 						context.logger.info(
// 							'Analytics event',
// 							logData as unknown as LoggerMetadata
// 						);

// 						// Here you would integrate with actual analytics services
// 						// This is just a placeholder

// 						return ctx.json({ success: true });
// 					}

// 					return ctx.json(
// 						{
// 							success: false,
// 							message: ERROR_CODES.MISSING_CONSENT,
// 						},
// 						{ status: 403 }
// 					);
// 				}
// 			),

// 			/**
// 			 * Endpoint to get available analytics providers
// 			 */
// 			getProviders: createEndpoint(
// 				'/providers',
// 				{
// 					method: 'GET',
// 					schema: {
// 						description: 'Get a list of configured analytics providers',
// 						responses: {
// 							'200': {
// 								description: 'List of analytics providers',
// 								content: {
// 									'application/json': {
// 										schema: {
// 											type: 'array',
// 											items: {
// 												type: 'object',
// 												properties: {
// 													id: {
// 														type: 'string',
// 														description: 'Provider ID',
// 													},
// 													name: {
// 														type: 'string',
// 														description: 'Display name',
// 													},
// 													url: {
// 														type: 'string',
// 														description: 'Provider website',
// 													},
// 													purposeId: {
// 														type: 'string',
// 														description: 'Consent purpose ID',
// 													},
// 												},
// 											},
// 										},
// 									},
// 								},
// 							},
// 						},
// 					},
// 				},
// 				async (ctx) => {
// 					// Return configured analytics providers (without sensitive config)
// 					const providersList = providers.map((provider) => ({
// 						id: provider.id,
// 						name: provider.name,
// 						url: provider.url,
// 						purposeId: provider.purposeId,
// 						// Don't return sensitive config details
// 					}));

// 					return ctx.json(providersList);
// 				}
// 			),
// 		},
// 	};
// };

// /**
//  * Type for the c15t client instance
//  */
// interface c15tClientInstance {
// 	/**
// 	 * Make a fetch request to an API endpoint
// 	 *
// 	 * @param path - API path to fetch
// 	 * @param options - Fetch options
// 	 * @returns Promise resolving to the API response
// 	 */
// 	$fetch: <T>(
// 		path: string,
// 		options?: { method: string; body?: unknown }
// 	) => Promise<T>;
// }

// /**
//  * Client-side analytics plugin
//  *
//  * This plugin adds analytics tracking methods to the c15t client,
//  * allowing client-side code to track events if the user has consented.
//  *
//  * @example
//  * ```typescript
//  * const client = createc15tClient({
//  *   plugins: [analyticsClient()]
//  * });
//  *
//  * // Track a page view
//  * client.analytics.track('page_view', 'google-analytics', {
//  *   page: window.location.pathname
//  * });
//  * ```
//  *
//  * @returns A client plugin with analytics methods
//  */
// export const analyticsClient = () => {
// 	return {
// 		id: 'analytics',
// 		methods: {
// 			/**
// 			 * Track an analytics event
// 			 *
// 			 * @param event - Event name to track
// 			 * @param provider - Analytics provider ID
// 			 * @param properties - Additional event properties
// 			 * @returns Promise resolving to the tracking response
// 			 */
// 			track: async function (
// 				this: c15tClientInstance,
// 				event: string,
// 				provider: string,
// 				properties?: EventProperties
// 			) {
// 				return this.$fetch('/analytics/track', {
// 					method: 'POST',
// 					body: {
// 						event,
// 						provider,
// 						properties,
// 					},
// 				});
// 			},

// 			/**
// 			 * Get a list of configured analytics providers
// 			 *
// 			 * @returns Promise resolving to an array of provider information
// 			 */
// 			getProviders: async function (this: c15tClientInstance) {
// 				return this.$fetch('/analytics/providers', {
// 					method: 'GET',
// 				});
// 			},
// 		},
// 	};
// };
