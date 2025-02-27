import { createConsentEndpoint } from '../call';
import { APIError } from 'better-call';
import type { ConsentContext } from '~/types';

/**
 * Get consent status endpoint
 */
export const getConsent = createConsentEndpoint(
	'/consent',
	{
		method: 'GET',
	},
	async (ctx) => {
		try {
			// Cast context to proper type
			const context = ctx.context as unknown as ConsentContext;

			// Get consent status
			const hasConsent = await context.getConsentStatus?.();

			// Get user preferences if consent exists
			const preferences = hasConsent
				? await context.getConsentPreferences?.()
				: null;

			return {
				consented: hasConsent,
				preferences,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			if (ctx.context && typeof ctx.context === 'object') {
				(ctx.context as any).logger?.error?.(
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
