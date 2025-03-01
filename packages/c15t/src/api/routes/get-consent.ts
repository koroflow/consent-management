// import { createAuthEndpoint } from '../call';
// import { APIError } from 'better-call';
// import { z } from 'zod';
// import type { C15TContext } from '../../types';
// import type { Record } from '~/db/schema/record/schema';
// import type { User } from '~/db/schema/user/schema';

// // Define schemas for the different identification methods
// const getByUserIdSchema = z.object({
// 	userId: z.string().uuid(),
// 	domain: z.string().optional(),
// 	identifierType: z.literal('userId'),
// });

// const getByExternalIdSchema = z.object({
// 	externalId: z.string(),
// 	domain: z.string().optional(),
// 	identifierType: z.literal('externalId'),
// });

// const getByIpAddressSchema = z.object({
// 	ipAddress: z.string(),
// 	domain: z.string(),
// 	identifierType: z.literal('ipAddress'),
// });

// // Combined schema using discriminated union
// const getConsentSchema = z.discriminatedUnion('identifierType', [
// 	getByUserIdSchema,
// 	getByExternalIdSchema,
// 	getByIpAddressSchema,
// ]);

// /**
//  * Endpoint for retrieving active consent records.
//  *
//  * This endpoint allows clients to retrieve a user's active consent records by specifying:
//  * 1. The user ID (internal UUID) and an optional domain
//  * 2. The external ID and an optional domain
//  * 3. The IP address and a required domain (since IP alone is too broad)
//  *
//  * @endpoint GET /consent/get
//  * @requestExample
//  * ```
//  * // By userId
//  * GET /api/consent/get?identifierType=userId&userId=550e8400-e29b-41d4-a716-446655440000&domain=example.com
//  * ```
//  *
//  * @requestExample
//  * ```
//  * // By externalId
//  * GET /api/consent/get?identifierType=externalId&externalId=user123&domain=example.com
//  * ```
//  *
//  * @requestExample
//  * ```
//  * // By ipAddress
//  * GET /api/consent/get?identifierType=ipAddress&ipAddress=192.168.1.1&domain=example.com
//  * ```
//  *
//  * @responseExample
//  * ```json
//  * {
//  *   "success": true,
//  *   "data": {
//  *     "hasActiveConsent": true,
//  *     "records": [
//  *       {
//  *         "id": 123,
//  *         "userId": "550e8400-e29b-41d4-a716-446655440000",
//  *         "domain": "example.com",
//  *         "isActive": true,
//  *         "givenAt": "2023-04-01T12:34:56.789Z",
//  *         "policyVersion": "1.0",
//  *         "preferences": {
//  *           "marketing": "2023-04-01T12:34:56.789Z",
//  *           "analytics": null,
//  *           "thirdParty": null
//  *         }
//  *       }
//  *     ],
//  *     "identifiedBy": "userId"
//  *   }
//  * }
//  * ```
//  *
//  * @returns {Object} Result of getting consent
//  * @returns {boolean} success - Whether the request was successful
//  * @returns {Object} data - Details about the consent
//  * @returns {boolean} data.hasActiveConsent - Whether the user has active consent
//  * @returns {Array} data.records - Active consent records
//  * @returns {string} data.identifiedBy - The method used to identify the user
//  *
//  * @throws {APIError} BAD_REQUEST - When request parameters are invalid
//  * @throws {APIError} NOT_FOUND - When the user or domain doesn't exist
//  */
// export const getConsent = createAuthEndpoint(
// 	'/consent/get',
// 	{
// 		method: 'GET',
// 		query: getConsentSchema,
// 	},
// 	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
// 	async (ctx) => {
// 		try {
// 			// Validate request query parameters
// 			const validatedData = getConsentSchema.safeParse(ctx.query);

// 			if (!validatedData.success) {
// 				throw new APIError('BAD_REQUEST', {
// 					message: 'Invalid request data',
// 					details: validatedData.error.errors,
// 				});
// 			}

// 			const params = validatedData.data;

// 			// Get domain from params if specified (domain validation will need to be handled separately)
// 			// This is a simplified approach - in a complete implementation, we would have a domain lookup method
// 			const domainId = params.domain ? params.domain : undefined;

// 			// Access the internal adapter from the context
// 			const registry = ctx.context?.registry;

// 			if (!registry) {
// 				throw new APIError('INTERNAL_SERVER_ERROR', {
// 					message: 'Internal adapter not available',
// 				});
// 			}

// 			// Find user based on identifier type
// 			let users: User[] = [];

// 			// biome-ignore lint/style/useDefaultSwitchClause: <explanation>
// 			switch (params.identifierType) {
// 				case 'userId': {
// 					const userRecord = await registry.findUserById(params.userId);
// 					if (userRecord) {
// 						users = [userRecord];
// 					}
// 					break;
// 				}
// 				case 'externalId': {
// 					const externalUser = await registry.findUserByExternalId(
// 						params.externalId
// 					);
// 					if (externalUser) {
// 						users = [externalUser];
// 					}
// 					break;
// 				}
// 				case 'ipAddress': {
// 					// For IP address lookups, we require a domain
// 					if (!domainId) {
// 						throw new APIError('BAD_REQUEST', {
// 							message: 'Domain is required when identifying by IP address',
// 							details: {
// 								ipAddress: params.ipAddress,
// 							},
// 						});
// 					}

// 					// This is a simplification - in a real implementation, we would need
// 					// a method to look up users by IP address, possibly by scanning recent consent records
// 					// For now, we'll use an empty array as this would require a custom query
// 					users = [];
// 					break;
// 				}
// 			}

// 			if (users.length === 0) {
// 				return {
// 					success: true,
// 					data: {
// 						hasActiveConsent: false,
// 						records: [],
// 						identifiedBy: params.identifierType,
// 					},
// 				};
// 			}

// 			// Get active consent records for these users
// 			const consentResults: Record[] = [];

// 			for (const user of users) {
// 				// Use the adapter to find user consents
// 				const userConsents = await registry.findUserConsents(user.id, domainId);

// 				// Filter for active consents only (adapter already does this, but to be explicit)
// 				const activeConsents = userConsents.filter(
// 					(consent) => consent.isActive
// 				);

// 				// Include user identification in the results
// 				for (const consent of activeConsents) {
// 					consentResults.push({
// 						...consent,
// 						id: user.id,
// 						consentId: '',
// 						recordType: 'form_submission',
// 						content: {},
// 						createdAt: new Date(),
// 					});
// 				}
// 			}

// 			return {
// 				success: true,
// 				data: {
// 					hasActiveConsent: consentResults.length > 0,
// 					records: consentResults,
// 					identifiedBy: params.identifierType,
// 				},
// 			};
// 		} catch (error) {
// 			if (ctx.context && typeof ctx.context === 'object') {
// 				// Type-safe logger access
// 				const contextWithLogger = ctx.context as unknown as C15TContext;
// 				contextWithLogger.logger?.error?.('Error getting consent:', error);
// 			}

// 			// Rethrow APIErrors as is
// 			if (error instanceof APIError) {
// 				throw error;
// 			}

// 			// Handle validation errors
// 			if (error instanceof z.ZodError) {
// 				throw new APIError('BAD_REQUEST', {
// 					message: 'Invalid request data',
// 					details: error.errors,
// 				});
// 			}

// 			// Handle other errors
// 			throw new APIError('INTERNAL_SERVER_ERROR', {
// 				message: 'An error occurred while processing the consent request',
// 				error: error instanceof Error ? error.message : String(error),
// 			});
// 		}
// 	}
// );
