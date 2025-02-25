import { type RouterConfig, createRouter } from 'better-call';
import { showConsentBanner } from './routes/show-consent-banner';
import { status } from './routes/status';

const router = (config: Partial<RouterConfig> = {}) =>
	createRouter(
		{
			status,
			showConsentBanner,
		},
		{
			basePath: config?.basePath || '/api/c15t',
			openapi: {
				disabled: config?.openapi?.disabled || false, //default false
				path: config?.openapi?.path || '/reference', //default /api/reference
				scalar: {
					title: 'c15t Middleware',
					version: '1.0.0',
					description: 'c15t Middleware',
					theme: config?.openapi?.scalar?.theme || 'dark',
				},
			},
		}
	);

export default router;
