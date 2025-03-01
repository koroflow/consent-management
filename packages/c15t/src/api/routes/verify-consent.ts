import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { User } from '~/db/schema/user/schema';

// Schema for the base verification criteria (at least domain is required)
const baseVerificationSchema = z.object({
	domain: z.string(),
	requiredPreferences: z.record(z.boolean()).optional(),
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

type VerifyConsentRequest = z.infer<typeof verifyConsentSchema>;

/**
 * Endpoint for verifying if a user has given consent.
 *
 * This endpoint allows checking if a user has provided consent for a specific domain
 * and verifies if the consent meets specific criteria (required preferences, policy version).
 * Users can be identified by userId, externalId, or ipAddress.
 *
 * @endpoint GET /consent/verify
 * @requestExample
 * ```
 * // Basic verification by userId
 * GET /api/consent/verify?userId=550e8400-e29b-41d4-a716-446655440000&domain=example.com
 * ```
 *
 * @requestExample
 * ```
 * // Verification with required preferences by externalId
 * GET /api/consent/verify?externalId=user123&domain=example.com&requiredPreferences[marketing]=true&requiredPreferences[analytics]=true
 * ```
 *
 * @requestExample
 * ```
 * // Verification with policy version by ipAddress
 * GET /api/consent/verify?ipAddress=192.168.1.1&domain=example.com&policyVersion=1.2
 * ```
 *
 * @responseExample
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "verified": true,
 *     "consentDetails": {
 *       "id": "123",
 *       "givenAt": "2023-04-01T12:34:56.789Z",
 *       "policyVersion": "1.2",
 *       "preferences": {
 *         "marketing": true,
 *         "analytics": true,
 *         "thirdParty": false
 *       }
 *     },
 *     "identifiedBy": "userId",
 *     "verificationResults": {
 *       "hasActiveConsent": true,
 *       "meetsPreferenceRequirements": true,
 *       "matchesPolicyVersion": true
 *     }
 *   }
 * }
 * ```
 *
 * @returns {Object} Result of verification
 * @returns {boolean} success - Whether the request was successful
 * @returns {Object} data - Verification data
 * @returns {boolean} data.verified - Whether the user's consent meets all criteria
 * @returns {Object|null} data.consentDetails - Details of the consent record if found
 * @returns {string} data.identifiedBy - Which identifier was used to find the user
 * @returns {Object} data.verificationResults - Detailed results of each verification check
 *
 * @throws {APIError} BAD_REQUEST - When request parameters are invalid
 * @throws {APIError} NOT_FOUND - When the domain doesn't exist
 */
export const verifyConsent = createAuthEndpoint(
	'/consent/verify',
	{
		method: 'GET',
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
	async (ctx) => {
		try {
			// Validate request query parameters
			const validatedData = verifyConsentSchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request data',
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

			// In the adapter pattern, we'll use the domain string as the domainId
			// Note: When the adapter is fully implemented, there should be a proper domain lookup method
			const domainId = params.domain;

			// Find user based on provided identifiers
			let userRecord: User | null = null;
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

			// If still not found and ipAddress provided, try to find by IP
			// Note: The internal adapter might not have a direct method for this
			// For now, we'll assume we can't look up by IP in the adapter
			// A complete implementation would add this functionality to the adapter
			if (!userRecord && params.ipAddress) {
				// This would be implemented in the adapter if needed
				// For now, return null to indicate user not found by IP
				identifierUsed = 'ipAddress';
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
			const userConsents = await registry.findUserConsents(userRecord.id);

			// Filter for active consents that match the domain
			const activeConsents = userConsents.filter(
				(consent) => consent.isActive && consent.domainId === domainId
			);

			// Sort consents by givenAt date, most recent first
			activeConsents.sort(
				(a, b) =>
					new Date(b.givenAt || 0).getTime() -
					new Date(a.givenAt || 0).getTime()
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
				const preferences = record.preferences || {};

				// Check if all required preferences are present and have the correct values
				for (const [key, requiredValue] of Object.entries(
					params.requiredPreferences
				)) {
					const hasPreference = key in preferences;

					// In timestamp-based format, a non-null timestamp means enabled
					const preferenceEnabled = hasPreference && preferences[key] !== null;

					if (params.requireExactMatch) {
						// Exact match requires preference to exist and match value exactly
						if (!hasPreference || preferenceEnabled !== requiredValue) {
							meetsPreferenceRequirements = false;
							break;
						}
					} else {
						// Non-exact match only checks if required trues are true
						// (only fails if a required true preference is false or doesn't exist)
						// biome-ignore lint/style/useCollapsedElseIf: <explanation>
						if (
							requiredValue === true &&
							(!hasPreference || !preferenceEnabled)
						) {
							meetsPreferenceRequirements = false;
							break;
						}
					}
				}
			}

			// Verify policy version if specified
			// Note: In the adapter pattern, this might be called policyId instead of policyVersion
			const matchesPolicyVersion = params.policyVersion
				? record.policyId === params.policyVersion
				: true;

			// Determine overall verification result
			const verified =
				record.isActive && meetsPreferenceRequirements && matchesPolicyVersion;

			// Return verification result
			return {
				success: true,
				data: {
					verified,
					consentDetails: {
						id: record.id,
						givenAt: record.givenAt,
						policyVersion: record.policyId, // Note the field name change
						preferences: record.preferences,
					},
					identifiedBy: identifierUsed,
					verificationResults: {
						hasActiveConsent: record.isActive,
						meetsPreferenceRequirements,
						matchesPolicyVersion,
					},
				},
			};
		} catch (error) {
			if (ctx.context && typeof ctx.context === 'object') {
				// Type-safe logger access
				const contextWithLogger = ctx.context as C15TContext;
				contextWithLogger.logger?.error?.('Error verifying consent:', error);
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
				message: 'An error occurred while verifying consent',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
