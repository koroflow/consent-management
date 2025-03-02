import { createEndpoint, createMiddleware } from 'better-call';
import type { C15TContext } from '~/types';

export const optionsMiddleware = createMiddleware(async () => {
	/**
	 * This will be passed on the instance of
	 * the context. Used to infer the type
	 * here.
	 */
	return {} as C15TContext;
});

export const createAuthMiddleware = createMiddleware.create({
	use: [
		optionsMiddleware,
		/**
		 * Only use for post hooks
		 */
		createMiddleware(async () => {
			return {} as {
				returned?: unknown;
				responseHeaders?: Headers;
			};
		}),
	],
});

export const createAuthEndpoint = createEndpoint.create({
	use: [optionsMiddleware],
});

export type C15TEndpoint = ReturnType<typeof createAuthEndpoint>;
export type C15TMiddleware = ReturnType<typeof createAuthMiddleware>;
