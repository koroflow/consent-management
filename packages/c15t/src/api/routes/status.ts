import { createAuthEndpoint } from '../call';

/**
 * Status endpoint that returns information about the c15t instance.
 *
 * This endpoint provides basic operational information about the c15t instance,
 * including its version, current timestamp, and consent configuration settings.
 * It can be used for:
 * - Health checks to verify the API is operational
 * - Version verification
 * - Retrieving configuration information about the consent system
 *
 * The endpoint does not require authentication and is accessible via a GET request.
 *
 * @endpoint GET /status
 * @responseExample
 * ```json
 * {
 *   "status": "ok",
 *   "version": "1.0.0",
 *   "timestamp": "2023-04-01T12:34:56.789Z",
 *   "consent": {
 *     "enabled": true,
 *     "updateAge": 90,
 *     "expiresIn": 365
 *   }
 * }
 * ```
 *
 * @returns {Object} Status information object
 * @returns {string} status - Service status ("ok" when operating normally)
 * @returns {string} version - Version number of the c15t instance
 * @returns {string} timestamp - ISO timestamp of when the request was processed
 * @returns {Object} consent - Consent configuration information
 * @returns {boolean} consent.enabled - Whether consent management is enabled
 * @returns {number} consent.updateAge - Days after which consent should be refreshed
 * @returns {number} consent.expiresIn - Days after which consent expires completely
 */
export const status = createAuthEndpoint(
	'/status',
	{
		method: 'GET',
	},
	async (ctx) => {
		const context = ctx.context;

		if (!context || typeof context !== 'object') {
			throw new Error('Invalid context object');
		}
		return {
			status: 'ok',
			version: context.version || '1.0.0',
			timestamp: new Date().toISOString(),
			consent: {
				enabled: context.consentConfig?.enabled,
				updateAge:
					typeof context.consentConfig?.updateAge === 'number'
						? context.consentConfig.updateAge
						: 90,
				expiresIn:
					typeof context.consentConfig?.expiresIn === 'number'
						? context.consentConfig.expiresIn
						: 365,
			},
		};
	}
);
