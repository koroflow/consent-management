import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext, ConsentPolicy, ConsentDomain } from '../../types';

// Define the schema for the base parameters (domain is always required)
const baseParamsSchema = z.object({
	domain: z.string(),
	version: z.string().optional(),
	includePreferences: z.boolean().optional().default(true),
});

// Define schemas for the different identification methods (all optional)
const userIdentifierSchema = z.object({
	userId: z.string().uuid().optional(),
	externalId: z.string().optional(),
	ipAddress: z.string().optional(),
});

// Combine the schemas
const getPolicySchema = baseParamsSchema.merge(userIdentifierSchema);

type GetPolicyRequest = z.infer<typeof getPolicySchema>;

/**
 * Endpoint for retrieving consent policy information.
 *
 * This endpoint allows clients to retrieve the consent policy for a domain.
 * It supports retrieving the latest policy or a specific version.
 * It can also return personalized policy information if user identifiers are provided.
 *
 * @endpoint GET /consent/policy
 * @requestExample
 * ```
 * // Basic policy request
 * GET /api/consent/policy?domain=example.com
 * ```
 *
 * @requestExample
 * ```
 * // Specific version
 * GET /api/consent/policy?domain=example.com&version=1.2
 * ```
 *
 * @requestExample
 * ```
 * // With user context
 * GET /api/consent/policy?domain=example.com&userId=550e8400-e29b-41d4-a716-446655440000
 * ```
 *
 * @responseExample
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "policy": {
 *       "id": 1,
 *       "domain": "example.com",
 *       "version": "1.0",
 *       "content": {
 *         "title": "Privacy Policy",
 *         "description": "How we use your data",
 *         "lastUpdated": "2023-04-01"
 *       },
 *       "availablePreferences": {
 *         "marketing": {
 *           "title": "Marketing",
 *           "description": "Allow us to send you marketing communications",
 *           "default": false
 *         },
 *         "analytics": {
 *           "title": "Analytics",
 *           "description": "Allow us to collect usage data to improve our service",
 *           "default": true
 *         }
 *       },
 *       "createdAt": "2023-04-01T12:34:56.789Z"
 *     },
 *     "userConsentStatus": {
 *       "hasConsent": true,
 *       "currentPreferences": {
 *         "marketing": null,
 *         "analytics": "2023-04-02T10:30:00.000Z"
 *       },
 *       "consentedAt": "2023-04-02T10:30:00.000Z",
 *       "needsRenewal": false
 *     }
 *   }
 * }
 * ```
 *
 * @returns {Object} Result of getting policy
 * @returns {boolean} success - Whether the request was successful
 * @returns {Object} data - The policy data
 * @returns {Object} data.policy - The consent policy information
 * @returns {Object} [data.userConsentStatus] - User's consent status if user identifiers were provided
 *
 * @throws {APIError} BAD_REQUEST - When request parameters are invalid
 * @throws {APIError} NOT_FOUND - When the domain or policy version doesn't exist
 */
export const getConsentPolicy = createAuthEndpoint(
	'/consent/policy',
	{
		method: 'GET',
	},
	async (ctx) => {
		try {
			// Validate request query parameters
			const validatedData = getPolicySchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request data',
					details: validatedData.error.errors,
				});
			}

			const params = validatedData.data;

			// Access the internal adapter from the context
			const internalAdapter = ctx.context?.internalAdapter;

			if (!internalAdapter) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Internal adapter not available',
				});
			}

			// Note: The internalAdapter doesn't have direct methods for domain and policy lookup yet
			// In a complete implementation, we would add these methods to the adapter
			// For now, we'll assume we have methods to get domains and policies

			// Find domain - This would be provided by internalAdapter.findDomainByName or similar
			// For now, we'll simulate finding a domain
			let domain: ConsentDomain | null = null;
			try {
				// This is a placeholder - in a real implementation, we would use an internal adapter method
				domain = {
					id: params.domain, // Using domain name as ID for simplicity
					domain: params.domain,
					isActive: true,
					// Other required domain properties would be here
					isPattern: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
			} catch (err) {
				throw new APIError('NOT_FOUND', {
					message: 'Domain not found',
					details: {
						domain: params.domain,
					},
				});
			}

			if (!domain) {
				throw new APIError('NOT_FOUND', {
					message: 'Domain not found',
					details: {
						domain: params.domain,
					},
				});
			}

			// Find the policy - This would be provided by internalAdapter.findPolicyByDomain or similar
			// For now, we'll simulate finding a policy
			let policy: ConsentPolicy | null = null;
			try {
				// This is a placeholder - in a real implementation, we would use an internal adapter method
				policy = {
					id: '1', // Using a string ID based on the schema we've seen
					version: params.version || '1.0',
					// biome-ignore lint/style/useTemplate: <explanation>
					name: 'Privacy Policy for ' + params.domain,
					effectiveDate: new Date(),
					content: 'This is the content of the privacy policy',
					contentHash: 'hash123',
					isActive: true,
					createdAt: new Date(),
					// Simulating availablePreferences for the policy
					// availablePreferences: {
					// 	marketing: {
					// 		title: "Marketing",
					// 		description: "Allow us to send you marketing communications",
					// 		default: false
					// 	},
					// 	analytics: {
					// 		title: "Analytics",
					// 		description: "Allow us to collect usage data to improve our service",
					// 		default: true
					// 	}
					// }
				};
			} catch (err) {
				throw new APIError('NOT_FOUND', {
					message: params.version
						? `Policy version ${params.version} not found for domain ${params.domain}`
						: `No policy found for domain ${params.domain}`,
					details: {
						domain: params.domain,
						version: params.version,
					},
				});
			}

			if (!policy) {
				throw new APIError('NOT_FOUND', {
					message: params.version
						? `Policy version ${params.version} not found for domain ${params.domain}`
						: `No policy found for domain ${params.domain}`,
					details: {
						domain: params.domain,
						version: params.version,
					},
				});
			}

			// Format basic response
			const response: {
				success: boolean;
				data: {
					policy: {
						id: string;
						domain: string;
						version: string;
						content: string;
						availablePreferences?: Record<string, unknown>;
						createdAt: Date;
					};
					userConsentStatus?: {
						hasConsent: boolean;
						currentPreferences: Record<string, unknown> | null;
						consentedAt: Date | null;
						needsRenewal: boolean;
						identifiedBy: string | null;
					};
				};
			} = {
				success: true,
				data: {
					policy: {
						id: policy.id,
						domain: params.domain,
						version: policy.version,
						content: policy.content,
						availablePreferences: params.includePreferences
							? //@ts-expect-error
								policy.availablePreferences
							: undefined,
						createdAt: policy.createdAt,
					},
				},
			};

			// If user identifiers were provided, try to find the user's consent status
			if (params.userId || params.externalId || params.ipAddress) {
				// biome-ignore lint/suspicious/noEvolvingTypes: <explanation>
				let userRecord = null;
				// biome-ignore lint/suspicious/noEvolvingTypes: <explanation>
				let identifierUsed = null;

				// Try to find user by userId
				if (params.userId) {
					userRecord = await internalAdapter.findUserById(params.userId);
					if (userRecord) {
						identifierUsed = 'userId';
					}
				}

				// If not found and externalId provided, try that
				if (!userRecord && params.externalId) {
					userRecord = await internalAdapter.findUserByExternalId(
						params.externalId
					);
					if (userRecord) {
						identifierUsed = 'externalId';
					}
				}

				// If still not found and ipAddress provided, try that - not directly supported by adapter
				// We would need an adapter method for finding users by IP address

				// If we found a user, get their consent status
				if (userRecord) {
					// Get user's active consents for this domain
					const userConsents = await internalAdapter.findUserConsents(
						userRecord.id,
						domain.id
					);

					// Get the latest active consent
					const userConsent = userConsents.length > 0 ? userConsents[0] : null;

					// Add user consent info to response
					response.data.userConsentStatus = {
						hasConsent: !!userConsent,
						currentPreferences: userConsent ? userConsent.preferences : null,
						consentedAt: userConsent ? userConsent.givenAt : null,
						needsRenewal: userConsent
							? userConsent.policyId !== policy.id
							: true,
						identifiedBy: identifierUsed,
					};
				}
			}

			return response;
		} catch (error) {
			if (ctx.context && typeof ctx.context === 'object') {
				// Type-safe logger access
				const contextWithLogger = ctx.context as unknown as C15TContext;
				contextWithLogger.logger?.error?.(
					'Error getting consent policy:',
					error
				);
			}

			// Rethrow APIErrors as is
			if (error instanceof APIError) {
				throw error;
			}

			// Handle validation errors
			if (error instanceof z.ZodError) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request data',
					details: error.errors,
				});
			}

			// Handle other errors
			throw new APIError('INTERNAL_SERVER_ERROR', {
				message: 'An error occurred while retrieving the consent policy',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
