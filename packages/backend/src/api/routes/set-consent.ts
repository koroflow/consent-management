import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { Consent } from '~/db/schema';

const ConsentType = z.enum([
	'cookie_banner',
	'privacy_policy',
	'dpa',
	'terms_of_service',
	'marketing_communications',
	'age_verification',
	'other',
]);

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
			const { registry } = ctx.context as C15TContext;

			// Find or create user
			const user = await registry.findOrCreateUser({
				userId,
				externalUserId,
				ipAddress: ctx.context.ipAddress || 'unknown',
			});

			if (!user) {
				throw new APIError('BAD_REQUEST', { message: 'User ID is required' });
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
					throw new APIError('BAD_REQUEST', {
						message: 'Policy ID is required',
					});
				}

				// Verify the policy exists and is active
				const policy = await registry.findConsentPolicyById(policyId);
				if (!policy) {
					throw new APIError('NOT_FOUND', {
						message: 'Consent policy not found',
					});
				}
				if (!policy.isActive) {
					throw new APIError('BAD_REQUEST', {
						message: 'Consent policy is no longer active',
					});
				}
			} else {
				const policy = await registry.findOrCreatePolicy(
					type.replace('_', ' ')
				);
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

			// Create consent record
			const consentRecord = await registry.createConsent({
				userId: user.id,
				domainId: domainRecord.id,
				policyId,
				status: 'active',
				givenAt: now,
				isActive: true,
				purposeIds,
				ipAddress: ctx.context.ipAddress || 'unknown',
				userAgent: ctx.context.userAgent || 'unknown',
				metadata: {
					...metadata,
					consentType: type,
				},
				history: [
					{
						actionType: 'given',
						timestamp: now,
						details: {
							ipAddress: ctx.context.ipAddress || 'unknown',
							userAgent: ctx.context.userAgent || 'unknown',
							consentType: type,
							...metadata,
						},
					},
				],
			});

			const consent = consentRecord as Consent;

			// Create consent record entry
			const record = await registry.createRecord({
				userId: user.id,
				consentId: consent.id,
				actionType: 'given',
				details: {
					ipAddress: ctx.context.ipAddress || 'unknown',
					userAgent: ctx.context.userAgent || 'unknown',
					consentType: type,
					...metadata,
				},
				createdAt: now,
				updatedAt: now,
			});

			// Create audit log entry
			await registry.createAuditLog({
				actionType: 'consent_created',
				entityType: 'consent',
				entityId: consent.id,
				userId: user.id,
				metadata: {
					consentId: consent.id,
					recordId: record.id,
					domainId: domainRecord.id,
					ipAddress: ctx.context.ipAddress || 'unknown',
					userAgent: ctx.context.userAgent || 'unknown',
					consentType: type,
					...metadata,
				},
				createdAt: now,
			});

			// Return response
			return {
				id: consent.id,
				userId: user.id,
				externalUserId: user.externalId ?? undefined,
				domainId: domainRecord.id,
				domain: domainRecord.name,
				type,
				status: consent.status,
				recordId: record.id,
				metadata,
				givenAt: consent.givenAt.toISOString(),
			};
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error setting consent:', error);

			if (error instanceof APIError) {
				throw error;
			}
			if (error instanceof z.ZodError) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid consent data',
					details: error.errors,
				});
			}

			throw new APIError('INTERNAL_SERVER_ERROR', {
				message: 'Failed to set consent',
				details:
					error instanceof Error ? { message: error.message } : { error },
			});
		}
	}
);
