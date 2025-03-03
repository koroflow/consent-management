import { createAuthEndpoint } from '../call';
import { z } from 'zod';
import type { EntityOutputFields } from '~/db/schema/definition';
import type { C15TContext } from '~/types';
import { APIError } from '..';
import { logger } from '~/utils';

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
 * @endpoint GET /consent/history
 */
export const getConsentHistory = createAuthEndpoint(
	'/consent/history',
	{
		method: 'GET',
		query: getConsentHistorySchema,
	},
	async (ctx) => {
		try {
			const params = getConsentHistorySchema.parse(ctx.query);
			const { registry } = ctx.context as C15TContext;

			if (!registry) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Registry not available',
					status: 503,
				});
			}

			let userConsents = await registry.findConsents({ userId: params.userId });
			if (params.domain) {
				userConsents = userConsents.filter(
					(consent: EntityOutputFields<'consent'>) =>
						consent.domainId === params.domain
				);
			}

			// Sort consents by givenAt date
			userConsents.sort(
				(a: EntityOutputFields<'consent'>, b: EntityOutputFields<'consent'>) =>
					(b.givenAt as Date).getTime() - (a.givenAt as Date).getTime()
			);

			// Apply pagination
			const start = params.offset;
			const end = start + params.limit;
			const paginatedConsents = userConsents.slice(start, end);

			// Process each consent to include withdrawals and records
			const processedConsents = await Promise.all(
				paginatedConsents.map(
					async (consent: EntityOutputFields<'consent'>) => {
						const withdrawals = await registry.getWithdrawals(consent.id);
						const records = await registry.getRecords(consent.id);

						return {
							id: consent.id,
							domainId: consent.domainId as string,
							status: consent.status as string,
							givenAt: (consent.givenAt as Date).toISOString(),
							withdrawals: withdrawals.map(
								(withdrawal: EntityOutputFields<'withdrawal'>) => ({
									id: withdrawal.id,
									createdAt: (withdrawal.createdAt as Date).toISOString(),
									reason: withdrawal.withdrawalReason || '',
									method: withdrawal.withdrawalMethod || '',
									actor:
										(withdrawal.metadata as Record<string, unknown>)?.actor ||
										'system',
									metadata: withdrawal.metadata as Record<string, unknown>,
								})
							),
							records: records.map((record: EntityOutputFields<'record'>) => ({
								id: record.id,
								createdAt: (record.createdAt as Date).toISOString(),
								type: record.actionType as string,
								details: record.details as Record<string, unknown>,
							})),
						};
					}
				)
			);

			// Get audit logs if available
			let auditLogs: Array<{
				id: string;
				createdAt: string;
				actionType: string;
				details: Record<string, unknown>;
			}> = [];
			if ('getAuditLogs' in registry) {
				const logs = await registry.findAuditLogs(params.userId);
				auditLogs = logs.map((log: EntityOutputFields<'auditLog'>) => ({
					id: log.id,
					createdAt: (log.createdAt as Date).toISOString(),
					actionType: log.actionType as string,
					details: log.changes as Record<string, unknown>,
				}));
			}

			const response = {
				success: true,
				data: {
					consents: processedConsents,
					auditLogs,
					pagination: {
						total: userConsents.length,
						offset: params.offset,
						limit: params.limit,
					},
				},
			};

			return response;
		} catch (error) {
			logger.error('Error getting consent history:', error);
			throw error;
		}
	}
);
