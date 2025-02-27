import { createConsentEndpoint } from '../call';
import { APIError } from 'better-call';
import type { ConsentContext } from '~/types';

/**
 * Set consent preferences endpoint
 */
export const setConsent = createConsentEndpoint(
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
				(ctx.context as any).logger?.error?.(
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
