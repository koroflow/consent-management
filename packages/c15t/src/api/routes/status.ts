import { createConsentEndpoint } from '../call';
import type { ConsentContext } from '../../types';

/**
 * Status endpoint that returns info about the c15t instance
 */
export const status = createConsentEndpoint(
	'/status',
	{
		method: 'GET',
	},
	async (ctx) => {
		// Cast context to proper type
		const context = ctx.context as unknown as ConsentContext;

		return {
			status: 'ok',
			version: context.version || '1.0.0',
			timestamp: new Date().toISOString(),
			consent: {
				enabled: context.consentConfig?.enabled,
				updateAge: context.consentConfig?.updateAge,
				expiresIn: context.consentConfig?.expiresIn,
			},
		};
	}
);
