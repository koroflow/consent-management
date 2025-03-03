import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { EntityOutputFields } from '~/db/schema/definition';

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

export interface GetPolicyResponse {
	success: boolean;
	data: {
		policy: {
			id: string;
			domain: string;
			version: string;
			content: string;
			availablePreferences?: Record<string, unknown>;
			createdAt: string;
		};
		userConsentStatus?: {
			hasConsent: boolean;
			currentPreferences: Record<string, string | null> | null;
			consentedAt: string | null;
			needsRenewal: boolean;
			identifiedBy: string | null;
		};
	};
}

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
		query: getPolicySchema,
	},
	async (ctx) => {
		try {
			const validatedData = getPolicySchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request data',
					details: validatedData.error.errors,
				});
			}

			const params = validatedData.data;
			const { registry } = ctx.context as C15TContext;

			if (!registry) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Registry not available',
					status: 503,
				});
			}

			// Find domain
			let domain: EntityOutputFields<'domain'> | null = null;
			try {
				if (registry.findDomain) {
					domain = await registry.findDomain(params.domain);
				}
			} catch {
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

			// Find the policy
			let policy: EntityOutputFields<'consentPolicy'> | null = null;
			try {
				if (registry.findPolicy) {
					policy = await registry.findPolicy(domain.id, params.version);
				}
			} catch {
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
			const response: GetPolicyResponse = {
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
						createdAt: policy.createdAt.toISOString(),
					},
				},
			};

			// If user identifiers were provided, try to find the user's consent status
			if (params.userId || params.externalId || params.ipAddress) {
				let userRecord: EntityOutputFields<'user'> | null = null;
				let identifierUsed: string | null = null;

				// Try to find user by userId
				if (params.userId) {
					userRecord = await registry.findUserById(params.userId);
					if (userRecord) {
						identifierUsed = 'userId';
					}
				}

				// If not found and externalId provided, try that
				if (!userRecord && params.externalId) {
					userRecord = await registry.findUserByExternalId(params.externalId);
					if (userRecord) {
						identifierUsed = 'externalId';
					}
				}

				// If we found a user, get their consent status
				if (userRecord) {
					// Get user's active consents for this domain
					const userConsents = await registry.findConsents({
						userId: userRecord.id,
						domainId: domain.id,
						status: 'active',
					});

					// Get the latest active consent
					const userConsent = userConsents.length > 0 ? userConsents[0] : null;

					// Add user consent info to response
					response.data.userConsentStatus = {
						hasConsent: !!userConsent,
						//@ts-expect-error
						currentPreferences: userConsent ? userConsent.preferences : null,
						consentedAt: userConsent
							? userConsent.givenAt.toISOString() || null
							: null,
						needsRenewal: userConsent
							? userConsent.policyId !== policy.id
							: true,
						identifiedBy: identifierUsed,
					};
				}
			}

			return response;
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error getting consent policy:', error);

			if (error instanceof APIError) {
				throw error;
			}
			if (error instanceof z.ZodError) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request data',
					details: error.errors,
				});
			}

			throw new APIError('INTERNAL_SERVER_ERROR', {
				message: 'Failed to get consent policy',
				status: 503,
				details:
					error instanceof Error ? { message: error.message } : { error },
			});
		}
	}
);
