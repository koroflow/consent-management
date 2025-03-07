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
	consentRecordRegistry,
	subjectRegistry,
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
		...consentRecordRegistry(ctx),
		...subjectRegistry(ctx),
		...withdrawalRegistry(ctx),
	};
};
