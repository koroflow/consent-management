import { Hono } from 'hono';
import { c15tInstance } from '@c15t/backend';
import { D1Dialect } from 'kysely-d1';
import type { D1Database } from '@cloudflare/workers-types';
import { env } from 'hono/adapter';

const app = new Hono();

// Initialize c15t instance

app.on(['POST', 'GET'], '/api/c15t/*', async (c) => {
	try {
		const { DB } = env<{
			DB: D1Database;
		}>(c);

		const c15t = c15tInstance({
			database: new D1Dialect({
				database: DB,
			}),
			basePath: '/api/c15t',
		});

		const result = await c15t.handler(c.req.raw);
		return result.match(
			(response) => response,
			(error) => {
				return new Response(
					JSON.stringify({
						error: true,
						message: error.message,
						code: error.code,
					}),
					{
						status: error.status || 500,
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
			}
		);
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: true,
				message:
					error instanceof Error ? error.message : 'Internal Server Error',
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
});

export default app;
