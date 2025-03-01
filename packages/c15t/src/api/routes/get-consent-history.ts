import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { AuditLog } from '~/db/schema/audit-log/schema';

// Define the schema for validating request parameters
const getConsentHistorySchema = z.object({
	userId: z.string().uuid(),
	domain: z.string().optional(),
	limit: z.coerce.number().int().positive().default(100),
	offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Endpoint for retrieving a user's complete consent history.
 *
 * This endpoint returns comprehensive information about a user's consent records,
 * including all consent entries, withdrawals, related evidence records, and audit logs.
 * It supports optional domain filtering and pagination to manage large result sets.
 *
 * The response includes:
 * - All consent records for the user (optionally filtered by domain)
 * - Associated withdrawal records for each consent
 * - Evidence/record entries for each consent
 * - Related audit log entries for the user
 * - Pagination information
 *
 * @endpoint GET /consent/history
 * @param {string} userId - Required UUID of the user to retrieve history for
 * @param {string} [domain] - Optional domain to filter consent records by
 * @param {number} [limit=100] - Maximum number of records to return
 * @param {number} [offset=0] - Number of records to skip for pagination
 *
 * @responseExample
 * ```json
 * {
 *   "userId": "550e8400-e29b-41d4-a716-446655440000",
 *   "consents": [
 *     {
 *       "id": "123",
 *       "domain": "example.com",
 *       "preferences": {
 *         "analytics": true,
 *         "marketing": false,
 *         "functional": true
 *       },
 *       "policyVersion": "1.0",
 *       "givenAt": "2023-08-15T14:30:00Z",
 *       "isActive": false,
 *       "metadata": {
 *         "source": "cookie_banner",
 *         "version": "2.5.0"
 *       },
 *       "withdrawals": [
 *         {
 *           "id": "45",
 *           "revokedAt": "2023-08-20T09:15:00Z",
 *           "reason": "User requested deletion",
 *           "method": "web_form",
 *           "actor": "user-self"
 *         }
 *       ],
 *       "records": [
 *         {
 *           "id": "67",
 *           "type": "form_submission",
 *           "typeDetail": "cookie_banner",
 *           "content": {
 *             "bannerVersion": "2.5.0"
 *           },
 *           "createdAt": "2023-08-15T14:30:00Z"
 *         }
 *       ]
 *     }
 *   ],
 *   "auditLogs": [
 *     {
 *       "id": "234",
 *       "timestamp": "2023-08-15T14:30:00Z",
 *       "action": "create_consent",
 *       "resourceType": "consents",
 *       "resourceId": "123",
 *       "actor": "user-self",
 *       "changes": {
 *         "before": null,
 *         "after": { "isActive": true }
 *       }
 *     }
 *   ],
 *   "pagination": {
 *     "limit": 100,
 *     "offset": 0,
 *     "total": 1
 *   }
 * }
 * ```
 *
 * @throws {APIError} BAD_REQUEST - When request parameters are invalid
 * @throws {APIError} NOT_FOUND - When the specified user is not found
 * @throws {APIError} INTERNAL_SERVER_ERROR - When operations fail
 */
export const getConsentHistory = createAuthEndpoint(
	'/consent/history',
	{
		method: 'GET',
	},
	async (ctx) => {
		try {
			// Validate request query parameters
			const validatedData = getConsentHistorySchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request parameters',
					details: validatedData.error.errors,
				});
			}

			// Access the internal adapter from the context
			const registry = ctx.context?.registry;

			if (!registry) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Internal adapter not available',
				});
			}

			const params = validatedData.data;

			// Check if user exists
			const userRecord = await registry.findUserById(params.userId);

			if (!userRecord) {
				throw new APIError('NOT_FOUND', {
					message: 'User not found',
					details: { userId: params.userId },
				});
			}

			// Get all consents for this user
			let userConsents = await registry.findUserConsents(params.userId);

			// Apply domain filtering if requested
			if (params.domain) {
				userConsents = userConsents.filter(
					(consent) =>
						consent.domainId === params.domain ||
						// Handle cases where domainId might be a domain object with a domain property
						//@ts-expect-error
						(typeof consent.domain === 'object' &&
							//@ts-expect-error
							consent.domain?.domain === params.domain)
				);
			}

			// Apply pagination
			const paginatedConsents = userConsents
				.sort(
					(a, b) =>
						new Date(b.givenAt || 0).getTime() -
						new Date(a.givenAt || 0).getTime()
				)
				.slice(params.offset, params.offset + params.limit);

			// Get audit logs for this user
			// Note: The internal adapter may not have a direct method for this
			// We'll need to simulate this functionality
			const auditLogs: AuditLog[] = [];

			// Process each consent to collect detailed information
			const processedConsents = await Promise.all(
				paginatedConsents.map(async (consent) => {
					// Get withdrawal records for this consent
					// const withdrawals: Withdrawal[] = [];

					// // Get consent records (evidence) for this consent
					// let records: Record[] = [];

					// try {
					// 	// If the adapter has a method to get consent records, use it
					// 	if (registry.getRecords) {
					// 		records = await registry.getRecords(consent.id);
					// 	}

					// 	// If the adapter has a method to get withdrawal records, use it
					// 	if (registry.getWithdrawals) {
					// 		const withdrawalRecords = await registry.getWithdrawals(consent.id);
					// 		withdrawals.push(...withdrawalRecords);
					// 	}

					// 	// If the adapter has a method to get audit logs for a consent, use it
					// 	if (registry.getAuditLogs) {
					// 		const auditLogs = await registry.getAuditLogs(consent.id);
					// 		auditLogs.push(...auditLogs);
					// 	}
					// } catch (error) {
					// 	// Log error but continue processing
					// 	if (ctx.context?.logger) {
					// 		ctx.context.logger.error(`Error retrieving related data for consent ${consent.id}:`, error);
					// 	}
					// }

					// // Get domain name - in this implementation we're assuming domainId is the domain name
					// const domainName = typeof consent.domain === 'object'
					// 	? consent.domain?.domain
					// 	: (consent.domainId || 'unknown');

					// Return a processed consent record with all related information
					return {
						id: consent.id,
						domain: 'domainName',
						preferences: consent.preferences || {},
						policyVersion: consent.policyId, // Note: renamed from policyVersion to policyId in the adapter
						givenAt: consent.givenAt,
						isActive: consent.isActive,
						metadata: consent.metadata || {},
						withdrawals: [],
						// // withdrawals: withdrawals.map((withdrawal) => ({
						// 	id: withdrawal.id,
						// 	revokedAt: withdrawal.revokedAt,
						// 	reason: withdrawal.revocationReason,
						// 	method: withdrawal.method,
						// 	actor: withdrawal.actor,
						// })),
						// records: records.map((record) => ({
						// 	id: record.id,
						// 	type: record.recordType,
						// 	typeDetail: record.recordTypeDetail,
						// 	content: record.content,
						// 	createdAt: record.createdAt,
						// })),
					};
				})
			);

			// Return consent history
			return {
				userId: params.userId,
				consents: processedConsents,
				auditLogs: auditLogs.map((log) => ({
					id: log.id,
					timestamp: log.timestamp,
					action: log.action,
					resourceType: log.resourceType,
					resourceId: log.resourceId,
					actor: log.actor,
					changes: log.changes,
				})),
				pagination: {
					limit: params.limit,
					offset: params.offset,
					total: userConsents.length, // This is the total count before pagination
				},
			};
		} catch (error) {
			// Log the error if context has a logger
			if (ctx.context && typeof ctx.context === 'object') {
				const contextWithLogger = ctx.context as C15TContext;
				contextWithLogger.logger?.error?.(
					'Error retrieving consent history:',
					error
				);
			}

			// Rethrow APIErrors as is
			if (error instanceof APIError) {
				throw error;
			}

			// Handle Zod validation errors
			if (error instanceof z.ZodError) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request parameters',
					details: error.errors,
				});
			}

			// Handle other errors
			throw new APIError('INTERNAL_SERVER_ERROR', {
				message: 'An error occurred while retrieving consent history',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
