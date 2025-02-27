import { status } from './status';
import { getConsent } from './get-consent';
import { setConsent } from './set-consent';
import type { ConsentEndpoint } from '../call';

/**
 * Export all API routes
 */
export const routes: Record<string, ConsentEndpoint> = {
	status,
	getConsent,
	setConsent,
};

export * from './status';
export * from './get-consent';
export * from './set-consent';
