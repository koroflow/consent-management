// import { createAuthEndpoint } from '../call';
// import { APIError } from 'better-call';
// import { z } from 'zod';
// import type { C15TContext } from '../../types';
// import type { Consent } from '~/db/schema/consent/schema';
// import type { User } from '~/db/schema/user/schema';

// // Define the schemas for validating request body
// // We'll have three different schemas for the three identification methods
// const withdrawByConsentIdSchema = z.object({
// 	consentId: z.string(),
// 	identifierType: z.literal('consentId'),
// 	reason: z.string().optional(),
// 	method: z.string().min(1).max(50),
// 	actor: z.string().optional(),
// 	metadata: z.record(z.any()).optional(),
// });

// const withdrawByUserIdSchema = z.object({
// 	userId: z.string().uuid(),
// 	domain: z.string(),
// 	identifierType: z.literal('userId'),
// 	reason: z.string().optional(),
// 	method: z.string().min(1).max(50),
// 	actor: z.string().optional(),
// 	metadata: z.record(z.any()).optional(),
// });

// const withdrawByExternalIdSchema = z.object({
// 	externalId: z.string(),
// 	domain: z.string(),
// 	identifierType: z.literal('externalId'),
// 	reason: z.string().optional(),
// 	method: z.string().min(1).max(50),
// 	actor: z.string().optional(),
// 	metadata: z.record(z.any()).optional(),
// });

// // Combined schema using discriminated union
// const withdrawConsentSchema = z.discriminatedUnion('identifierType', [
// 	withdrawByConsentIdSchema,
// 	withdrawByUserIdSchema,
// 	withdrawByExternalIdSchema,
// ]);

// type WithdrawConsentRequest = z.infer<typeof withdrawConsentSchema>;

// /**
//  * Endpoint for withdrawing previously given consent.
//  *
//  * This endpoint allows clients to revoke a user's consent by specifying either:
//  * 1. The specific consent ID to withdraw
//  * 2. The user ID and domain to withdraw all active consents for that user on that domain
//  * 3. The external user ID and domain to withdraw all active consents for that user on that domain
//  *
//  * The withdrawal process deactivates the consent record, creates a withdrawal record,
//  * and maintains a complete audit trail.
//  *
//  * @endpoint POST /consent/withdraw
//  * @requestExample
//  * ```json
//  * // By consentId
//  * {
//  *   "identifierType": "consentId",
//  *   "consentId": "123",
//  *   "reason": "User requested deletion of data",
//  *   "method": "privacy_dashboard",
//  *   "actor": "user-self",
//  *   "metadata": {
//  *     "requestId": "abc-123",
//  *     "channel": "web"
//  *   }
//  * }
//  * ```
//  *
//  * @requestExample
//  * ```json
//  * // By userId and domain
//  * {
//  *   "identifierType": "userId",
//  *   "userId": "550e8400-e29b-41d4-a716-446655440000",
//  *   "domain": "example.com",
//  *   "reason": "User requested deletion of data",
//  *   "method": "privacy_dashboard",
//  *   "actor": "user-self"
//  * }
//  * ```
//  *
//  * @requestExample
//  * ```json
//  * // By externalId and domain
//  * {
//  *   "identifierType": "externalId",
//  *   "externalId": "user123",
//  *   "domain": "example.com",
//  *   "reason": "User requested deletion of data",
//  *   "method": "privacy_dashboard",
//  *   "actor": "user-self"
//  * }
//  * ```
//  *
//  * @responseExample
//  * ```json
//  * {
//  *   "success": true,
//  *   "data": {
//  *     "withdrawalIds": ["45"],
//  *     "consentIds": ["123"],
//  *     "revokedAt": "2023-04-01T12:34:56.789Z"
//  *   }
//  * }
//  * ```
//  *
//  * @returns {Object} Result of withdrawing consent
//  * @returns {boolean} success - Whether the consent was successfully withdrawn
//  * @returns {Object} data - Details about the withdrawal
//  * @returns {string[]} data.withdrawalIds - The IDs of the newly created withdrawal records
//  * @returns {string[]} data.consentIds - The IDs of the consent records that were withdrawn
//  * @returns {string} data.revokedAt - ISO timestamp of when the consent was withdrawn
//  *
//  * @throws {APIError} BAD_REQUEST - When withdrawal request is invalid
//  * @throws {APIError} NOT_FOUND - When the specified consent, user, or domain doesn't exist
//  * @throws {APIError} CONFLICT - When the consent has already been withdrawn
//  */
// export const withdrawConsent = createAuthEndpoint(
// 	'/consent/withdraw',
// 	{
// 		method: 'POST',
// 	},
// 	async (ctx) => {
// 		try {
// 			// Validate request body
// 			const validatedData = withdrawConsentSchema.safeParse(ctx.body);

// 			if (!validatedData.success) {
// 				throw new APIError('BAD_REQUEST', {
// 					message: 'Invalid request data',
// 					details: validatedData.error.errors,
// 				});
// 			}

// 			// Access the internal adapter from the context
// 			const registry = ctx.context?.registry;

// 			if (!registry) {
// 				throw new APIError('INTERNAL_SERVER_ERROR', {
// 					message: 'Internal adapter not available',
// 				});
// 			}

// 			const params = validatedData.data;

// 			// Find the consent records to withdraw based on the identifier type
// 			let recordsToWithdraw: Consent[] = [];

// 			if (params.identifierType === 'consentId') {
// 				// Find by consent ID
// 				const record = await registry.findConsent(params.consentId);

// 				if (!record) {
// 					throw new APIError('NOT_FOUND', {
// 						message: 'Consent record not found',
// 						details: {
// 							consentId: params.consentId,
// 						},
// 					});
// 				}

// 				if (!record.consent.isActive) {
// 					throw new APIError('CONFLICT', {
// 						message: 'Consent has already been withdrawn',
// 						details: {
// 							consentId: params.consentId,
// 						},
// 					});
// 				}

// 				recordsToWithdraw = [record.consent];
// 			} else if (
// 				params.identifierType === 'userId' ||
// 				params.identifierType === 'externalId'
// 			) {
// 				// For the domain handling, since there's no direct domain method in the adapter,
// 				// we'll use the domain string as the domainId for simplicity
// 				const domainId = params.domain;

// 				// Find user
// 				let userRecord: User | null = null;
// 				if (params.identifierType === 'userId') {
// 					userRecord = await registry.findUserById(params.userId);
// 				} else {
// 					userRecord = await registry.findUserByExternalId(params.externalId);
// 				}

// 				if (!userRecord) {
// 					throw new APIError('NOT_FOUND', {
// 						message: 'User not found',
// 						details: {
// 							[params.identifierType]:
// 								params.identifierType === 'userId'
// 									? params.userId
// 									: params.externalId,
// 						},
// 					});
// 				}

// 				// Find all active consents for this user and domain
// 				const userConsents = await registry.findUserConsents(userRecord.id);

// 				// Filter for active consents with matching domain
// 				recordsToWithdraw = userConsents.filter(
// 					(consent) => consent.isActive && consent.domainId === domainId
// 				);

// 				if (recordsToWithdraw.length === 0) {
// 					throw new APIError('NOT_FOUND', {
// 						message: 'No active consent records found for this user and domain',
// 						details: {
// 							[params.identifierType]:
// 								params.identifierType === 'userId'
// 									? params.userId
// 									: params.externalId,
// 							domain: params.domain,
// 						},
// 					});
// 				}
// 			}

// 			// Get device info from request
// 			const requestHeaders = ctx.request?.headers as
// 				| Record<string, string>
// 				| undefined;
// 			const deviceInfo = requestHeaders?.['user-agent'] || '';
// 			// @ts-ignore
// 			const ipAddress = ctx.request?.ip || null;

// 			// Process each consent record to withdraw
// 			const withdrawalResults = [];
// 			const currentTime = new Date().toISOString();

// 			for (const record of recordsToWithdraw) {
// 				// Use the revokeConsent method from the internal adapter
// 				const withdrawalResult = await registry.revokeConsent({
// 					consentId: record.id,
// 					reason: params.reason || '',
// 					// method: 'API withdrawal',
// 					actor: params.actor || 'system',
// 					metadata: params.metadata || {},
// 				});

// 				// Add consent record for the withdrawal
// 				await registry.createRecord({
// 					consentId: record.id,
// 					recordType: 'withdrawal',
// 					recordTypeDetail: 'API withdrawal',
// 					content: {
// 						reason: params.reason,
// 						method: params.method,
// 						identifierType: params.identifierType,
// 						// Store original preferences for audit purposes
// 						preferences: record.preferences,
// 						withdrawnAt: currentTime,
// 					},
// 					ipAddress,
// 					recordMetadata: {
// 						deviceInfo,
// 						...params.metadata,
// 					},
// 				});

// 				// Log the action in the audit log
// 				await registry.createAuditLog({
// 					action: 'withdraw_consent',
// 					userId: record.userId,
// 					resourceType: 'consents',
// 					resourceId: record.id,
// 					actor: params.actor || 'system',
// 					deviceInfo,
// 					ipAddress,
// 					changes: {
// 						before: {
// 							isActive: true,
// 							preferences: record.preferences,
// 						},
// 						after: {
// 							isActive: false,
// 							// Set all preferences to null (withdrawn)
// 							preferences: Object.fromEntries(
// 								Object.entries(record.preferences || {}).map(([key]) => [
// 									key,
// 									null, // Setting to null indicates withdrawal
// 								])
// 							),
// 							revokedAt: currentTime,
// 						},
// 					},
// 				});

// 				withdrawalResults.push({
// 					id: withdrawalResult?.withdrawal?.id || `withdrawal-${record.id}`,
// 					consentId: record.id,
// 					revokedAt: currentTime,
// 				});
// 			}

// 			// Return success response with withdrawal details
// 			return {
// 				success: true,
// 				data: {
// 					withdrawalIds: withdrawalResults.map((wr) => wr.id),
// 					consentIds: withdrawalResults.map((wr) => wr.consentId),
// 					revokedAt: withdrawalResults[0]?.revokedAt || currentTime,
// 				},
// 			};
// 		} catch (error) {
// 			if (ctx.context && typeof ctx.context === 'object') {
// 				// Type-safe logger access
// 				const contextWithLogger = ctx.context as C15TContext;
// 				contextWithLogger.logger?.error?.('Error withdrawing consent:', error);
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
// 				message: 'An error occurred while processing the withdrawal',
// 				error: error instanceof Error ? error.message : String(error),
// 			});
// 		}
// 	}
// );
