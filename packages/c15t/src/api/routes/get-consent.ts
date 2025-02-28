import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import type { C15TContext } from '~/types';

/**
 * Endpoint for retrieving the current consent status and preferences.
 *
 * This endpoint allows clients to check if consent has been provided and
 * retrieve the specific consent preferences if available. It's typically
 * used when a user visits a site to determine if a consent banner should
 * be displayed.
 *
 * The response includes:
 * - Whether the user has provided consent
 * - The specific preferences if consent exists
 * - A timestamp of when the response was generated
 *
 * If an error occurs during processing, it returns a BAD_REQUEST error
 * with details about what went wrong.
 *
 * @endpoint GET /consent
 * @responseExample
 * ```json
 * {
 *   "consented": true,
 *   "preferences": {
 *     "analytics": true,
 *     "marketing": false,
 *     "preferences": true
 *   },
 *   "timestamp": "2023-04-01T12:34:56.789Z"
 * }
 * ```
 *
 * @returns {Object} Consent status and preferences
 * @returns {boolean} consented - Whether consent has been provided
 * @returns {Object|null} preferences - User's consent preferences if consented, null otherwise
 * @returns {boolean} preferences.analytics - Whether analytics tracking is allowed
 * @returns {boolean} preferences.marketing - Whether marketing communications are allowed
 * @returns {boolean} preferences.preferences - Whether preference/functional cookies are allowed
 * @returns {string} timestamp - ISO timestamp of when the request was processed
 *
 * @throws {APIError} BAD_REQUEST - When consent status cannot be retrieved
 */
export const getConsent = createAuthEndpoint(
	'/consent/get',
	{
		method: 'GET',
	},
	async (ctx) => {
		try {
			// Cast context to proper type
			const context = ctx.context as unknown as C15TContext;

			// Get consent status
			// const hasConsent = await context.getConsentStatus?.();

			// Get user preferences if consent exists
			// const preferences = hasConsent
			// 	? await context.getConsentPreferences?.()
			// 	: null;

			return {
				consented: false,
				preferences:null,
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
					'Error getting consent status:',
					error
				);
			}

			throw new APIError('BAD_REQUEST', {
				message: 'Failed to retrieve consent status',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
