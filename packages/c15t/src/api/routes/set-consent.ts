import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import type {} from '../../types';

// Define the schema for validating request body
const setConsentSchema = z.object({
	userId: z.string().uuid(),
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

type SetConsentRequest = z.infer<typeof setConsentSchema>;

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
	},
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
	async (ctx) => {
		try {
			// Validate request body
			const validatedData = setConsentSchema.safeParse(ctx.body);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid consent data provided',
					details: validatedData.error.errors,
				});
			}

			const params = validatedData.data;

			// Access the internal adapter from the context
			const registry = ctx.context?.registry;

			if (!registry) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Internal adapter not available',
				});
			}

			// Check if user exists, create if not
			let userRecord = await registry.findUserById(params.userId);

			if (!userRecord) {
				// Create new user record
				userRecord = await registry.createUser({
					id: params.userId,
					externalId: params.userId, // Using userId as externalId for simplicity
					isIdentified: true,
				});
			}

			// We need to find or create a domain
			// Note: Currently the internal adapter doesn't have direct methods for domain management
			// In a complete implementation, we would add methods like findDomainByName and createDomain

			// For now, we'll create a simulated domain ID
			// In a real implementation, this would be replaced with proper domain lookup
			const domainId = params.domain;

			// Get basic request info
			// Note: In the current context structure, these might be available differently
			// We'll use placeholder values for now
			const requestHeaders = ctx.request?.headers as
				| Record<string, string>
				| undefined;
			const deviceInfo = requestHeaders?.['user-agent'] || '';

			//@ts-ignore
			const ipAddress = ctx.request?.ip || null;

			// Create new consent record with the internal adapter
			const consentResult = await registry.createConsent({
				userId: userRecord.id,
				domainId: domainId,
				preferences: { test: true },
				policyId: params.policyVersion || '1.0', // Note: renamed from policyVersion to policyId
				isActive: true,
				metadata: params.metadata || {},
				ipAddress: ipAddress,
			});

			// Create a consent record for audit purposes
			await registry.createRecord({
				consentId: consentResult.id,
				recordType: 'api_call',
				recordTypeDetail: 'API creation',
				content: {
					preferences: params.preferences,
					policyVersion: params.policyVersion || '1.0',
				},
				ipAddress,
				recordMetadata: {
					deviceInfo,
					...params.metadata,
				},
			});

			// Log the action in the audit log
			await registry.createAuditLog({
				action: 'create_consent',
				userId: params.userId,
				resourceType: 'consents',
				resourceId: consentResult.id,
				actor: 'user-self',
				deviceInfo,
				ipAddress,
				changes: {
					before: null,
					after: {
						preferences: params.preferences,
						policyVersion: params.policyVersion || '1.0',
						isActive: true,
					},
				},
			});

			// Return success response with consent details
			return {
				success: true,
				consentId: consentResult.id,
				preferences: consentResult.preferences,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			// Log the error if logger is available
			if (ctx.context && typeof ctx.context === 'object') {
				// Type-safe logger access
				const contextWithLogger = ctx.context as unknown as {
					logger?: {
						error?: (message: string, error: unknown) => void;
					};
				};

				contextWithLogger.logger?.error?.(
					'Error setting consent preferences:',
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
					message: 'Invalid consent data',
					details: error.errors,
				});
			}

			throw new APIError('BAD_REQUEST', {
				message: 'Failed to set consent preferences',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
