import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import type { ConsentContext } from '~/types';

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
 * Upon successful processing, it returns the saved preferences and a success indicator.
 * If validation fails or an error occurs during processing, it returns a BAD_REQUEST
 * error with details about what went wrong.
 *
 * @endpoint POST /consent/set
 * @requestExample
 * ```json
 * {
 *   "preferences": {
 *     "analytics": true,
 *     "marketing": false,
 *     "preferences": true
 *   }
 * }
 * ```
 *
 * @responseExample
 * ```json
 * {
 *   "success": true,
 *   "preferences": {
 *     "analytics": true,
 *     "marketing": false,
 *     "preferences": true
 *   },
 *   "timestamp": "2023-04-01T12:34:56.789Z"
 * }
 * ```
 *
 * @returns {Object} Result of setting consent preferences
 * @returns {boolean} success - Whether the preferences were successfully saved
 * @returns {Object} preferences - The saved consent preferences
 * @returns {boolean} preferences.analytics - Whether analytics tracking is allowed
 * @returns {boolean} preferences.marketing - Whether marketing communications are allowed
 * @returns {boolean} preferences.preferences - Whether preference/functional cookies are allowed
 * @returns {string} timestamp - ISO timestamp of when the preferences were saved
 *
 * @throws {APIError} BAD_REQUEST - When preferences are invalid or cannot be saved
 */
export const setConsent = createAuthEndpoint(
	'/consent/set',
	{
		method: 'POST',
	},
	async (ctx) => {
		try {
			// Cast context to proper type
			const context = ctx.context as unknown as ConsentContext;

			const { preferences } = ctx.body || {};

			if (!preferences || typeof preferences !== 'object') {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid consent preferences provided',
					received: preferences,
				});
			}

			// Validate preferences structure
			if (
				!('analytics' in preferences) ||
				!('marketing' in preferences) ||
				!('preferences' in preferences)
			) {
				throw new APIError('BAD_REQUEST', {
					message:
						'Consent preferences must include analytics, marketing, and preferences fields',
					received: preferences,
				});
			}

			// Set consent preferences
			await context.setConsentPreferences?.(preferences);

			return {
				success: true,
				preferences,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
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

			throw new APIError('BAD_REQUEST', {
				message:
					error instanceof APIError
						? error.message
						: 'Failed to set consent preferences',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
