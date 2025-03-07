import type { RegistryContext } from '~/types/context';

import {
	auditLogRegistry,
	consentGeoLocationRegistry,
	consentRegistry,
	domainRegistry,
	geoLocationRegistry,
	policyRegistry,
	purposeJunctionRegistry,
	purposeRegistry,
	recordRegistry,
	userRegistry,
	withdrawalRegistry,
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
