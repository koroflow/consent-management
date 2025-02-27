import { status } from './status';
import { getConsent } from './get-consent';
import { setConsent } from './set-consent';
import type { ConsentEndpoint } from '../call';

/**
 * Collection of all API endpoints for the consent management system.
 *
 * This object exports all available routes as a record of endpoint names
 * to their implementations. It serves as the central registry for all
 * consent-related API endpoints.
 *
 * Available endpoints:
 * - `status`: Returns information about the c15t instance
 * - `getConsent`: Retrieves the current consent status and preferences
 * - `setConsent`: Updates consent preferences
 *
 * @example
 * ```typescript
 * import { createAPI } from '@c15t/core';
 * import { routes } from '@c15t/api/routes';
 *
 * // Create API with all consent routes
 * const api = createAPI({
 *   endpoints: routes
 * });
 * ```
 */
export const routes: Record<string, ConsentEndpoint> = {
	status,
	getConsent,
	setConsent,
};

export * from './status';
export * from './get-consent';
export * from './set-consent';
