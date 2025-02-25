import { createEndpoint } from 'better-call';

export const status = createEndpoint(
	'/status',
	{
		method: 'GET',
		metadata: {
			openapi: {
				responses: {
					'200': {
						description: 'Status of the API',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										status: { type: 'string' },
										uptime: { type: 'number' },
										timestamp: { type: 'string' },
										version: { type: 'string' },
									},
								},
							},
						},
					},
				},
			},
		},
	},
	// biome-ignore lint/suspicious/useAwait: This is a middleware function, so it's okay to use await
	async () => {
		const uptime = process.uptime();
		return {
			status: 'healthy',
			uptime: Math.floor(uptime),
			timestamp: new Date().toISOString(),
			version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
		};
	}
);
