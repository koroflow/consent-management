import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { EntityOutputFields } from '~/db/schema/definition';

// Define the schemas for validating request body
// We'll have three different schemas for the three identification methods
const withdrawByConsentIdSchema = z.object({
	consentId: z.string(),
	identifierType: z.literal('consentId'),
	reason: z.string().optional(),
	method: z.string().min(1).max(50),
	actor: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

const withdrawByUserIdSchema = z.object({
	userId: z.string(),
	domain: z.string(),
	identifierType: z.literal('userId'),
	reason: z.string().optional(),
	method: z.string().min(1).max(50),
	actor: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

const withdrawByExternalIdSchema = z.object({
	externalId: z.string(),
	domain: z.string(),
	identifierType: z.literal('externalId'),
	reason: z.string().optional(),
	method: z.string().min(1).max(50),
	actor: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

// Combined schema using discriminated union
const withdrawConsentSchema = z.discriminatedUnion('identifierType', [
	withdrawByConsentIdSchema,
	withdrawByUserIdSchema,
	withdrawByExternalIdSchema,
]);

export interface WithdrawConsentResponse {
	success: boolean;
	data: {
		withdrawalIds: string[];
		consentIds: string[];
		revokedAt: string;
	};
}

/**
 * Endpoint for withdrawing previously given consent.
 *
 * This endpoint allows clients to revoke a user's consent by specifying either:
 * 1. The specific consent ID to withdraw
 * 2. The user ID and domain to withdraw all active consents for that user on that domain
 * 3. The external user ID and domain to withdraw all active consents for that user on that domain
 *
 * @endpoint POST /consent/withdraw
 */
export const withdrawConsent = createAuthEndpoint(
	'/consent/withdraw',
	{
		method: 'POST',
		body: withdrawConsentSchema,
	},
	async (ctx) => {
		try {
			const validatedData = withdrawConsentSchema.safeParse(ctx.body);

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

			// Find the consent records to withdraw based on the identifier type
			let recordsToWithdraw: EntityOutputFields<'consent'>[] = [];

			if (params.identifierType === 'consentId') {
				// Find by consent ID
				const record = await registry.findConsentById(params.consentId);

				if (!record) {
					throw new APIError('NOT_FOUND', {
						message: 'Consent record not found',
						details: {
							consentId: params.consentId,
						},
					});
				}

				if (record.status !== 'active') {
					throw new APIError('CONFLICT', {
						message: 'Consent has already been withdrawn',
						details: {
							consentId: params.consentId,
						},
					});
				}

				recordsToWithdraw = [record];
			} else if (
				params.identifierType === 'userId' ||
				params.identifierType === 'externalId'
			) {
				// Find user
				let userRecord: EntityOutputFields<'user'> | null = null;
				if (params.identifierType === 'userId') {
					userRecord = await registry.findUserById(params.userId);
				} else {
					userRecord = await registry.findUserByExternalId(params.externalId);
				}

				if (!userRecord) {
					throw new APIError('NOT_FOUND', {
						message: 'User not found',
						details: {
							[params.identifierType]:
								params.identifierType === 'userId'
									? params.userId
									: params.externalId,
						},
					});
				}

				// Find all active consents for this user and domain
				const userConsents = await registry.findConsents({
					userId: userRecord.id,
				});

				// Filter for active consents with matching domain
				recordsToWithdraw = userConsents.filter(
					(consent) =>
						consent.status === 'active' && consent.domainId === params.domain
				);

				if (recordsToWithdraw.length === 0) {
					throw new APIError('NOT_FOUND', {
						message: 'No active consent records found for this user and domain',
						details: {
							[params.identifierType]:
								params.identifierType === 'userId'
									? params.userId
									: params.externalId,
							domain: params.domain,
						},
					});
				}
			}

			// Get device info from request
			const requestHeaders = ctx.request?.headers as
				| Record<string, string>
				| undefined;
			const deviceInfo = requestHeaders?.['user-agent'] || '';
			// @ts-expect-error
			const ipAddress = ctx.request?.ip || '';

			// Process each consent record to withdraw
			const withdrawalResults: Array<{
				id: string;
				consentId: string;
				revokedAt: string;
			}> = [];

			const currentTime = new Date();

			for (const record of recordsToWithdraw) {
				// Use the revokeConsent method from the internal adapter
				const withdrawalResult = await registry.revokeConsent({
					consentId: record.id,
					reason: params.reason || '',
					actor: params.actor || 'system',
					metadata: params.metadata || {},
				});

				// Add consent record for the withdrawal
				await registry.createRecord({
					userId: record.userId,
					consentId: record.id,
					actionType: 'withdraw_consent',
					details: {
						reason: params.reason,
						method: params.method,
						identifierType: params.identifierType,
						withdrawnAt: currentTime.toISOString(),
					},
				});

				// Log the action in the audit log
				await registry.createAuditLog({
					userId: record.userId,
					entityType: 'consent',
					entityId: record.id,
					actionType: 'withdraw_consent',
					changes: {
						policyVersion: record.policyId,
					},
					metadata: {
						source: 'api',
						...params.metadata,
					},
					ipAddress,
					userAgent: deviceInfo,
					createdAt: currentTime,
				});

				withdrawalResults.push({
					id: withdrawalResult?.id || `withdrawal-${record.id}`,
					consentId: record.id,
					revokedAt: currentTime.toISOString(),
				});
			}

			// Return success response with withdrawal details
			return {
				success: true,
				data: {
					withdrawalIds: withdrawalResults.map((wr) => wr.id),
					consentIds: withdrawalResults.map((wr) => wr.consentId),
					revokedAt:
						withdrawalResults[0]?.revokedAt || currentTime.toISOString(),
				},
			};
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error withdrawing consent:', error);

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
				message: 'Failed to withdraw consent',
				status: 503,
				details:
					error instanceof Error ? { message: error.message } : { error },
			});
		}
	}
);
