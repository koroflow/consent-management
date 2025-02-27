import { createEndpoint, createMiddleware } from '../../api/endpoint';
import type { C15tPlugin, ConsentContext, EndpointContext } from '../../types';
// plugins/geo/index.ts

// Define a type for the geo context extension
interface GeoContext {
	geo?: {
		ip: string;
		country?: string;
		region?: string;
		source: string;
	};
}

interface GeoPluginOptions {
	/**
	 * Enable geo-targeting
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Which headers to use for IP detection
	 * @default ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip']
	 */
	ipHeaders?: string[];

	/**
	 * Special jurisdiction rules
	 */
	jurisdictions?: Array<{
		/**
		 * Jurisdiction code (e.g., 'GDPR', 'CCPA', etc.)
		 */
		code: string;

		/**
		 * Country codes this jurisdiction applies to
		 */
		countries: string[];

		/**
		 * Region codes this jurisdiction applies to (optional)
		 */
		regions?: Record<string, string[]>;

		/**
		 * Required purposes for this jurisdiction
		 */
		requiredPurposes?: string[];

		/**
		 * Default purposes for this jurisdiction (opt-in)
		 */
		defaultPurposes?: string[];
	}>;

	/**
	 * IP geolocation service
	 */
	geoService?: {
		/**
		 * Type of geolocation service
		 */
		type: 'cloudflare' | 'maxmind' | 'ipapi' | 'custom';

		/**
		 * Custom geolocation function
		 */
		getLocation?: (ip: string) => Promise<{
			country?: string;
			region?: string;
			city?: string;
		} | null>;

		/**
		 * API key (if required)
		 */
		apiKey?: string;
	};
}

export const geo = (options?: GeoPluginOptions): C15tPlugin => {
	const ipHeaders = options?.ipHeaders || [
		'cf-connecting-ip',
		'x-forwarded-for',
		'x-real-ip',
	];

	// Middleware to get visitor's location
	const geoMiddleware = createMiddleware(async (ctx: EndpointContext) => {
		// Skip if disabled
		if (options?.enabled === false) {
			return { geo: null };
		}

		// Get IP address safely
		let ip = 'unknown';
		for (const header of ipHeaders) {
			const headerValue = ctx.headers.get(header);
			if (headerValue) {
				// Handle null or undefined headerValue
				ip = headerValue.split(',')[0]?.trim() || 'unknown';
				break;
			}
		}

		// Get country from Cloudflare headers if available
		const cfCountry = ctx.headers.get('cf-ipcountry');
		const cfRegion = ctx.headers.get('cf-region');

		if (cfCountry) {
			return {
				geo: {
					ip,
					country: cfCountry,
					region: cfRegion || undefined,
					source: 'cloudflare-headers',
				},
			};
		}

		// Otherwise use configured geo service
		if (options?.geoService) {
			try {
				let location = null;

				if (
					options.geoService.type === 'custom' &&
					options.geoService.getLocation
				) {
					location = await options.geoService.getLocation(ip);
				} else if (options.geoService.type === 'ipapi') {
					// Simple IP API implementation
					const response = await fetch(`https://ipapi.co/${ip}/json/`);
					if (response.ok) {
						const data = await response.json();
						location = {
							country: data.country_code,
							region: data.region_code,
							city: data.city,
						};
					}
				}
				// Add other geo service implementations as needed

				if (location) {
					return {
						geo: {
							ip,
							...location,
							source: options.geoService.type,
						},
					};
				}
			} catch (error) {
				ctx.context.logger.error('Error getting geolocation', error);
			}
		}

		// Fallback - no location data
		return {
			geo: {
				ip,
				source: 'ip-only',
			},
		};
	});

	return {
		id: 'geo',

		init(context: ConsentContext) {
			// Add the geo configuration to the global options
			context.options.geo = {
				...context.options.geo,
				enabled: options?.enabled !== false,
			};

			// Return void instead of an object with different structure
			return;
		},

		endpoints: {
			getJurisdiction: createEndpoint(
				async (
					ctx: EndpointContext & {
						geo?: {
							ip: string;
							country?: string;
							region?: string;
							source: string;
						};
					}
				) => {
					const geo = ctx.geo;

					if (!geo || !geo.country) {
						return ctx.json({
							jurisdiction: 'UNKNOWN',
							country: geo?.country || 'UNKNOWN',
							region: geo?.region,
							requiredPurposes: [],
							defaultPurposes: [],
						});
					}

					// Find applicable jurisdiction
					let jurisdiction = 'UNKNOWN';
					let requiredPurposes: string[] = [];
					let defaultPurposes: string[] = [];

					if (options?.jurisdictions && options.jurisdictions.length > 0) {
						for (const j of options.jurisdictions) {
							// Check if country matches
							if (j.countries.includes(geo.country)) {
								// If regions are specified, check if region matches
								let regionMatch = true;
								if (j.regions && geo.region && j.regions[geo.country]) {
									// Make sure we safely check if regions[country] exists before using includes
									regionMatch =
										j.regions[geo.country]?.includes(geo.region) ?? false;
								}

								if (regionMatch) {
									jurisdiction = j.code;
									requiredPurposes = j.requiredPurposes || [];
									defaultPurposes = j.defaultPurposes || [];
									break;
								}
							}
						}
					}

					return ctx.json({
						jurisdiction,
						country: geo.country,
						region: geo.region,
						requiredPurposes,
						defaultPurposes,
					});
				},
				{
					method: 'GET',
					use: [geoMiddleware],
				}
			),

			getGeoInfo: createEndpoint(
				async (
					ctx: EndpointContext & {
						geo?: {
							ip: string;
							country?: string;
							region?: string;
							source: string;
						};
					}
				) => {
					// Return the geo information that was added by the middleware
					const geo = ctx.geo;

					return ctx.json({
						ip: geo?.ip,
						country: geo?.country,
						region: geo?.region,
						source: geo?.source,
					});
				},
				{
					method: 'GET',
					use: [geoMiddleware],
				}
			),
		},

		hooks: {
			before: [
				{
					matcher(context) {
						return context.path === '/update-consent';
					},
					async handler(ctx) {
						// If geo plugin is enabled, apply jurisdiction-specific rules
						if (options?.enabled === false) {
							return;
						}

						// Get geo information - get the result from middleware
						const geoResult = await geoMiddleware(ctx);

						// Fix: Access the geo object directly from the context, not from result.geo
						const geoInfo = ctx.geo;

						if (!geoInfo?.country) {
							return;
						}

						// Find applicable jurisdiction
						if (options?.jurisdictions) {
							for (const j of options.jurisdictions) {
								const countryMatch = j.countries.includes(geoInfo.country);
								let regionMatch = true;

								// Check region if specified
								if (countryMatch && geoInfo.region && j.regions) {
									// Use optional chaining and nullish coalescing to safely check for region match
									regionMatch =
										j.regions[geoInfo.country]?.includes(geoInfo.region) ??
										false;
								}

								if (countryMatch && regionMatch) {
									// Apply jurisdiction-specific rules
									if (j.requiredPurposes && j.requiredPurposes.length > 0) {
										// Ensure required purposes have consent
										const body = ctx.body as Record<string, any>;
										if (body.preferences) {
											j.requiredPurposes.forEach((purposeId) => {
												body.preferences[purposeId] = true;
											});
										}
									}
									break;
								}
							}
						}
					},
				},
			],
		},
	};
};

// Client plugin
export const geoClient = () => {
	return {
		id: 'geo',
		methods: {
			getJurisdiction: async function (this: any) {
				return this.$fetch('/geo/jurisdiction', {
					method: 'GET',
				});
			},

			getLocation: async function (this: any) {
				return this.$fetch('/geo/location', {
					method: 'GET',
				});
			},
		},
		$InferServerPlugin: {} as ReturnType<typeof geo>,
	};
};
