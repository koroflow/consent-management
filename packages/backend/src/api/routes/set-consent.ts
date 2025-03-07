import { createAuthEndpoint } from '../call';
import { C15TError, BASE_ERROR_CODES } from '~/error';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { Consent, inferRecord } from '~/db/schema';
import type { Adapter } from '~/db/adapters/types';

const ConsentType = z.enum([
	'cookie_banner',
	'privacy_policy',
	'dpa',
	'terms_of_service',
	'marketing_communications',
	'age_verification',
	'other',
]);

export type ConsentType = z.infer<typeof ConsentType>;

// Base schema for all consent types
const baseConsentSchema = z.object({
	userId: z.string().optional(),
	externalUserId: z.string().optional(),
	domain: z.string(),
	type: ConsentType,
	metadata: z.record(z.unknown()).optional(),
});

// Cookie banner needs preferences
const cookieBannerSchema = baseConsentSchema.extend({
	type: z.literal('cookie_banner'),
	preferences: z.record(z.boolean()),
});

// Policy based consent just needs the policy ID
const policyBasedSchema = baseConsentSchema.extend({
	type: z.enum(['privacy_policy', 'dpa', 'terms_of_service']),
	policyId: z.string().optional(),
	preferences: z.record(z.boolean()).optional(),
});

// Other consent types just need the base fields
const otherConsentSchema = baseConsentSchema.extend({
	type: z.enum(['marketing_communications', 'age_verification', 'other']),
	preferences: z.record(z.boolean()).optional(),
});

const setConsentSchema = z.discriminatedUnion('type', [
	cookieBannerSchema,
	policyBasedSchema,
	otherConsentSchema,
]);

export interface SetConsentResponse {
	success: boolean;
	consentId: string;
	timestamp: string;
}

/**
 * Endpoint for creating a new consent record.
 *
 * This endpoint allows clients to create a new consent record for a user. It supports
 * different types of consent:
 * - cookie_banner: For cookie preferences
 * - privacy_policy: For privacy policy acceptance
 * - dpa: For data processing agreement acceptance
 * - terms_of_service: For terms of service acceptance
 * - marketing_communications: For marketing preferences
 * - age_verification: For age verification
 * - other: For other types of consent
 *
 * @endpoint POST /consents
 * @requestExample
 * ```json
 * // Cookie Banner
 * {
 *   "type": "cookie_banner",
 *   "domain": "example.com",
 *   "preferences": {
 *     "experience": true,
 *     "functionality": true,
 *     "marketing": true,
 *     "measurement": false,
 *     "necessary": true
 *   },
 *   "metadata": {
 *     "source": "banner",
 *     "displayedTo": "user",
 *     "language": "en-US"
 *   }
 * }
 *
 * // Privacy Policy
 * {
 *   "type": "privacy_policy",
 *   "userId": "550e8400-e29b-41d4-a716-446655440000",
 *   "domain": "example.com",
 *   "policyId": "pol_xyz789",
 *   "metadata": {
 *     "source": "account_creation",
 *     "acceptanceMethod": "checkbox"
 *   }
 * }
 * ```
 */
export const setConsent = createAuthEndpoint(
	'/consent/set',
	{
		method: 'POST',
		body: setConsentSchema,
	},
	async (ctx) => {
		try {
			const body = setConsentSchema.parse(ctx.body);
			const { type, userId, externalUserId, domain, metadata } = body;
			const { registry, adapter } = ctx.context as C15TContext;

			// Find or create user
			const user = await registry.findOrCreateUser({
				userId,
				externalUserId,
				ipAddress: ctx.context.ipAddress || 'unknown',
			});

			if (!user) {
				throw new C15TError(
					'A valid User ID is required to proceed with the consent operation. Please provide a User ID.',
					{
						code: BASE_ERROR_CODES.MISSING_REQUIRED_PARAMETER,
						status: 400,
					}
				);
			}

			// Find or create domain
			const domainRecord = await registry.findOrCreateDomain(domain);

			const now = new Date();
			let policyId: string | undefined;
			let purposeIds: string[] = [];

			// Handle policy creation/finding
			if ('policyId' in body) {
				const { policyId: pid } = body;
				policyId = pid;

				if (!policyId) {
					throw new C15TError(
						'A valid Policy ID is required to proceed with the consent operation. Please provide a Policy ID.',
						{
							code: BASE_ERROR_CODES.MISSING_REQUIRED_PARAMETER,
							status: 400,
						}
					);
				}

				// Verify the policy exists and is active
				const policy = await registry.findConsentPolicyById(policyId);
				if (!policy) {
					throw new C15TError(
						'The specified consent policy could not be found. Please verify the policy ID and try again.',
						{
							code: BASE_ERROR_CODES.NOT_FOUND,
							status: 404,
						}
					);
				}
				if (!policy.isActive) {
					throw new C15TError(
						'The consent policy is no longer active and cannot be used. Please use an active policy version.',
						{
							code: BASE_ERROR_CODES.CONFLICT,
							status: 409,
						}
					);
				}
			} else {
				const policy = await registry.findOrCreatePolicy(
					type.replace('_', ' ')
				);
				if (!policy) {
					throw new C15TError(
						'Failed to create or find the required policy. Please try again later or contact support if the issue persists.',
						{
							code: BASE_ERROR_CODES.FAILED_TO_CREATE_PURPOSE,
							status: 500,
						}
					);
				}
				policyId = policy.id;
			}

			// Handle purposes if they exist
			if ('preferences' in body && body.preferences) {
				purposeIds = await Promise.all(
					Object.entries(body.preferences)
						.filter(([_, isConsented]) => isConsented)
						.map(async ([purposeCode]) => {
							let existingPurpose =
								await registry.findPurposeByCode(purposeCode);
							if (!existingPurpose) {
								existingPurpose = await registry.createPurpose({
									code: purposeCode,
									name: purposeCode,
									description: `Auto-created purpose for ${purposeCode}`,
									isActive: true,
									isEssential: false,
									dataCategory: 'functional',
									legalBasis: 'consent',
									createdAt: now,
									updatedAt: now,
								});
							}
							return existingPurpose.id;
						})
				);
			}

			// Execute all consent-related operations in a transaction
			const result = await adapter.transaction({
				callback: async (tx: Adapter) => {
					// Create consent record
					const consentRecord = (await tx.create({
						model: 'consent',
						data: {
							userId: user.id,
							domainId: domainRecord.id,
							policyId,
							purposeIds,
							status: 'active',
							isActive: true,
							givenAt: now,
							history: [],
						},
					})) as unknown as Consent;

					// Create record entry
					const record = (await tx.create({
						model: 'record',
						data: {
							userId: user.id,
							consentId: consentRecord.id,
							actionType: 'consent_given',
							details: metadata,
							createdAt: now,
						},
					})) as unknown as inferRecord;

					// Create audit log entry
					await tx.create({
						model: 'auditLog',
						data: {
							userId: user.id,
							entityType: 'consent',
							entityId: consentRecord.id,
							action: 'create',
							details: {
								consentId: consentRecord.id,
								type,
							},
							timestamp: now,
						},
					});

					return {
						consent: consentRecord,
						record,
					};
				},
			});

			if (!result || !result.consent || !result.record) {
				throw new C15TError(
					'Failed to create the consent record. Please try again later or contact support if the issue persists.',
					{
						code: BASE_ERROR_CODES.FAILED_TO_CREATE_CONSENT,
						status: 500,
					}
				);
			}

			// Return response
			return {
				id: result.consent.id,
				userId: user.id,
				externalUserId: user.externalId ?? undefined,
				domainId: domainRecord.id,
				domain: domainRecord.name,
				type,
				status: result.consent.status,
				recordId: result.record.id,
				metadata,
				givenAt: result.consent.givenAt.toISOString(),
			};
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error setting consent:', error);

			if (error instanceof C15TError) {
				throw error;
			}
			if (error instanceof z.ZodError) {
				throw new C15TError(
					'The consent data provided is invalid. Please ensure all required fields are correctly filled and formatted.',
					{
						code: BASE_ERROR_CODES.BAD_REQUEST,
						status: 400,
						data: {
							details: error.errors,
						},
					}
				);
			}

			throw new C15TError(
				'Failed to set consent. Please try again later or contact support if the issue persists.',
				{
					code: BASE_ERROR_CODES.FAILED_TO_CREATE_CONSENT,
					status: 500,
					data: {
						error: error instanceof Error ? error.message : String(error),
					},
				}
			);
		}
	}
);
