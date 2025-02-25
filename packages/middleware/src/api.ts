import { createRouter } from 'better-call';
import { showCookieBanner } from './routes/show-cookie-banner';
import { status } from './routes/status';

const router = createRouter(
	{
		status,
		showCookieBanner,
	},
	{
		basePath: '/api/c15t',
		openapi: {
			disabled: false, //default false
			path: '/reference', //default /api/reference
			scalar: {
				title: 'c15t Middleware',
				version: '1.0.0',
				description: 'c15t Middleware',
				theme: 'dark',
			},
		},
	}
);

export default router;
