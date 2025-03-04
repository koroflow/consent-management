import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type { C15TContext } from '../../types';

// Define the schema for validating request body
const setConsentSchema = z.object({
	userId: z.string(),
	domain: z.string(),
	// Preferences now use timestamps directly (null = disabled)
	preferences: z
		.object({
			analytics: z.string().datetime().nullable(),
			marketing: z.string().datetime().nullable(),
			preferences: z.string().datetime().nullable(),
		})
		.strict(),
	policyVersion: z.string().optional(),
	metadata: z.record(z.any()).optional(),
});

export interface SetConsentResponse {
	success: boolean;
	consentId: string;
	preferences: {
		analytics: string | null;
		marketing: string | null;
		preferences: string | null;
	};
	timestamp: string;
}

/**
 * Endpoint for setting user consent preferences.
 *
 * This endpoint allows clients to save a user's consent preferences. It validates
 * that the provided preferences contain all required fields before saving them.
 * The required fields are:
 * - analytics: Controls if analytics tracking is allowed
 * - marketing: Controls if marketing communications are allowed
 * - preferences: Controls if preference/functional cookies are allowed
 *
 * Each preference is stored as a timestamp value (when consent was given) or null (when disabled).
 * This approach provides better audit capabilities and usage tracking.
 *
 * Upon successful processing, it returns the saved preferences and a success indicator.
 * If validation fails or an error occurs during processing, it returns a BAD_REQUEST
 * error with details about what went wrong.
 *
 * @endpoint POST /consent/set
 * @requestExample
 * ```json
 * {
 *   "userId": "550e8400-e29b-41d4-a716-446655440000",
 *   "domain": "example.com",
 *   "preferences": {
 *     "analytics": "2023-04-01T12:34:56.789Z",
 *     "marketing": null,
 *     "preferences": "2023-04-01T12:34:56.789Z"
 *   },
 *   "policyVersion": "1.0",
 *   "metadata": {
 *     "source": "cookie_banner",
 *     "bannerVersion": "2.5.0"
 *   }
 * }
 * ```
 *
 * @responseExample
 * ```json
 * {
 *   "success": true,
 *   "consentId": 123,
 *   "preferences": {
 *     "analytics": "2023-04-01T12:34:56.789Z",
 *     "marketing": null,
 *     "preferences": "2023-04-01T12:34:56.789Z"
 *   },
 *   "timestamp": "2023-04-01T12:34:56.789Z"
 * }
 * ```
 *
 * @returns {Object} Result of setting consent preferences
 * @returns {boolean} success - Whether the preferences were successfully saved
 * @returns {number} consentId - The ID of the newly created consent record
 * @returns {Object} preferences - The saved consent preferences
 * @returns {string|null} preferences.analytics - When analytics tracking was enabled (null if disabled)
 * @returns {string|null} preferences.marketing - When marketing was enabled (null if disabled)
 * @returns {string|null} preferences.preferences - When preference cookies were enabled (null if disabled)
 * @returns {string} timestamp - ISO timestamp of when the preferences were saved
 *
 * @throws {APIError} BAD_REQUEST - When preferences are invalid or cannot be saved
 * @throws {APIError} NOT_FOUND - When user or domain doesn't exist
 */
export const setConsent = createAuthEndpoint(
	'/consent/set',
	{
		method: 'POST',
		body: setConsentSchema,
	},
	async (ctx) => {
		try {
			const validatedData = setConsentSchema.safeParse(ctx.body);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid consent data provided',
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

			// Check if user exists, create if not
			let user = await registry.findUserByExternalId(params.userId);

			if (!user) {
				user = await registry.createUser({
					externalId: params.userId,
					isIdentified: false,
					createdAt: new Date(),
				});

				if (!user) {
					throw new APIError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create user',
						status: 503,
					});
				}
			}

			const now = new Date();

			// Create consent record
			const consent = await registry.createRecord({
				userId: user.id,
				actionType: 'set_consent',
				details: {
					preferences: params.preferences,
					policyVersion: params.policyVersion,
				},
				// metadata: params.metadata,
				//@ts-expect-error
				ipAddress: ctx.request?.ip || '1.1.1',
				//@ts-expect-error
				userAgent: ctx.request?.headers?.['user-agent'] || 'test',
				createdAt: now,
			});

			// Create audit log
			await registry.createAuditLog({
				userId: user.id,
				entityType: 'consent',
				entityId: consent.id,
				actionType: 'create_consent',
				changes: {
					preferences: params.preferences,
					policyVersion: params.policyVersion,
				},
				metadata: {
					source: 'api',
					...params.metadata,
				},
				//@ts-expect-error
				ipAddress: ctx.request?.ip || '1.1.1',
				//@ts-expect-error
				userAgent: ctx.request?.headers?.['user-agent'] || 'test',
				createdAt: now,
			});

			const response: SetConsentResponse = {
				success: true,
				consentId: consent.id,
				preferences: params.preferences,
				timestamp: now.toISOString(),
			};

			return response;
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
				message: 'Failed to set consent preferences',
				status: 503,
				details:
					error instanceof Error ? { message: error.message } : { error },
			});
		}
	}
);
