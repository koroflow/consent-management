import { c15tInstance } from '@c15t/backend';

import { LibsqlDialect } from '@libsql/kysely-libsql';

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
	throw new Error(
		'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required'
	);
}

const libsql = new LibsqlDialect({
	url: process.env.TURSO_DATABASE_URL,
	authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Authentication and authorization configuration using c15t
 *
 * This module configures and exports a shared instance of c15t with settings
 * appropriate for the Hono Example application. It handles database connections,
 * consent management, and authentication strategies.
 *
 * @example
 * ```ts
 * // In an API route handler
 * import { c15t } from '../c15t';
 *
 * // For Hono route
 * import { Hono } from 'hono';
 *
 * const app = new Hono();
 * app.use('/api/c15t/*', c15t.handle);
 * ```
 *
 * @throws {Error} When required environment variables are missing
 * @see {@link https://docs.c15t.dev/configuration} for more configuration options
 */
export const c15t = c15tInstance({
	appName: 'Hono D1 Example App',
	basePath: '/api/c15t',
	// Add any trusted origins if needed
	trustedOrigins: ['http://localhost:3000'],
	// Configure storage adapter
	// database: memoryAdapter({}),
	database: libsql,
	// Configure consent options
	consent: {
		expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
		updateAge: 60 * 60 * 24, // 24 hours in seconds
	},
	// plugins: [geo(), analytics()],
	// Enable analytics plugin if needed
	analytics: {
		enabled: true,
	},
});
