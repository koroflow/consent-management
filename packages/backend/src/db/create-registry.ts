import type { RegistryContext } from '~/types/context';

import {
	userRegistry,
	purposeRegistry,
	recordRegistry,
	auditLogRegistry,
	consentRegistry,
	domainRegistry,
	purposeJunctionRegistry,
	withdrawalRegistry,
	geoLocationRegistry,
	policyRegistry,
	consentGeoLocationRegistry,
} from './schema/index';

export const createRegistry = (ctx: RegistryContext) => {
	return {
		...auditLogRegistry(ctx),
		...consentRegistry(ctx),
		...domainRegistry(ctx),
		...geoLocationRegistry(ctx),
		...consentGeoLocationRegistry(ctx),
		...purposeJunctionRegistry(ctx),
		...purposeRegistry(ctx),
		...policyRegistry(ctx),
		...recordRegistry(ctx),
		...userRegistry(ctx),
		...withdrawalRegistry(ctx),
	};
};
