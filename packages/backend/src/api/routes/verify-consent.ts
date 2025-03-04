import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { EntityOutputFields } from '~/db/schema/definition';

// Schema for the base verification criteria (at least domain is required)
const baseVerificationSchema = z.object({
	domain: z.string(),
	requiredPreferences: z.record(z.string().datetime().nullable()).optional(),
	requireExactMatch: z.boolean().optional().default(false),
	policyVersion: z.string().optional(),
});

// Define schemas for the different identification methods
// At least one identifier must be provided
const identifierSchema = z
	.object({
		userId: z.string().uuid().optional(),
		externalId: z.string().optional(),
		ipAddress: z.string().optional(),
	})
	.refine(
		(data) =>
			data.userId !== undefined ||
			data.externalId !== undefined ||
			data.ipAddress !== undefined,
		{
			message:
				'At least one identifier (userId, externalId, or ipAddress) must be provided',
		}
	);

// Combine the schemas
const verifyConsentSchema = baseVerificationSchema.and(identifierSchema);

export interface VerifyConsentResponse {
	success: boolean;
	data: {
		verified: boolean;
		consentDetails: {
			id: string;
			givenAt: string;
			policyVersion: string;
			preferences: Record<string, string | null>;
		} | null;
		identifiedBy: string | null;
		verificationResults: {
			hasActiveConsent: boolean;
			meetsPreferenceRequirements: boolean;
			matchesPolicyVersion: boolean;
		};
	};
}

/**
 * Endpoint for verifying if a user has given consent.
 *
 * This endpoint allows checking if a user has provided consent for a specific domain
 * and verifies if the consent meets specific criteria (required preferences, policy version).
 * Users can be identified by userId, externalId, or ipAddress.
 *
 * @endpoint GET /consent/verify
 */
export const verifyConsent = createAuthEndpoint(
	'/consent/verify',
	{
		method: 'GET',
		query: verifyConsentSchema,
	},
	async (ctx) => {
		try {
			const validatedData = verifyConsentSchema.safeParse(ctx.query);

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

			// Find user based on provided identifiers
			let userRecord: EntityOutputFields<'user'> | null = null;
			let identifierUsed: string | null = null;

			// Try to find user by userId (most precise)
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

			// If no user found, return negative verification
			if (!userRecord) {
				return {
					success: true,
					data: {
						verified: false,
						consentDetails: null,
						identifiedBy: null,
						verificationResults: {
							hasActiveConsent: false,
							meetsPreferenceRequirements: false,
							matchesPolicyVersion: false,
						},
					},
				};
			}

			// Find active consents for this user
			const userConsents = await registry.findConsents({
				userId: userRecord.id,
			});

			// Filter for active consents that match the domain
			const activeConsents = userConsents.filter(
				(consent) =>
					consent.status === 'active' && consent.domainId === params.domain
			);

			// Sort consents by givenAt date, most recent first
			activeConsents.sort(
				(a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime()
			);

			// Get the most recent active consent for this domain, if any
			const record = activeConsents.length > 0 ? activeConsents[0] : null;

			// If no consent found, return negative verification
			if (!record) {
				return {
					success: true,
					data: {
						verified: false,
						consentDetails: null,
						identifiedBy: identifierUsed,
						verificationResults: {
							hasActiveConsent: false,
							meetsPreferenceRequirements: false,
							matchesPolicyVersion: false,
						},
					},
				};
			}

			// Verify consent meets criteria if specified
			let meetsPreferenceRequirements = true;
			if (params.requiredPreferences) {
				const preferences =
					(record.metadata as Record<string, unknown>)?.preferences || {};

				// Check if all required preferences are present and have the correct values
				for (const [key, requiredValue] of Object.entries(
					params.requiredPreferences
				)) {
					//@ts-expect-error
					const hasPreference = key in preferences;
					//@ts-expect-error
					const preferenceEnabled = hasPreference && preferences[key] !== null;

					if (params.requireExactMatch) {
						// Exact match requires preference to exist and match value exactly
						if (
							!hasPreference ||
							preferenceEnabled !== (requiredValue !== null)
						) {
							meetsPreferenceRequirements = false;
							break;
						}
					} else if (requiredValue !== null && !preferenceEnabled) {
						// Non-exact match only checks if required trues are true
						meetsPreferenceRequirements = false;
						break;
					}
				}
			}

			// Verify policy version if specified
			const matchesPolicyVersion = params.policyVersion
				? record.policyId === params.policyVersion
				: true;

			// Determine overall verification result
			const verified =
				record.status === 'active' &&
				meetsPreferenceRequirements &&
				matchesPolicyVersion;

			// Return verification result
			return {
				success: true,
				data: {
					verified,
					consentDetails: {
						id: record.id,
						givenAt: record.givenAt.toISOString(),
						policyVersion: record.policyId || '',
						preferences:
							(record.metadata as Record<string, unknown>)?.preferences || {},
					},
					identifiedBy: identifierUsed,
					verificationResults: {
						hasActiveConsent: record.status === 'active',
						meetsPreferenceRequirements,
						matchesPolicyVersion,
					},
				},
			};
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error verifying consent:', error);

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
				message: 'Failed to verify consent',
				status: 503,
				details:
					error instanceof Error ? { message: error.message } : { error },
			});
		}
	}
);
