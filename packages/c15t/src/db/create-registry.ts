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
} from './schema/index';

export const createRegistry = (ctx: RegistryContext) => {
	return {
		...auditLogRegistry(ctx),
		...consentRegistry(ctx),
		...domainRegistry(ctx),
		...geoLocationRegistry(ctx),
		...purposeJunctionRegistry(ctx),
		...purposeRegistry(ctx),
		...recordRegistry(ctx),
		...userRegistry(ctx),
		...withdrawalRegistry(ctx),
		...withdrawalRegistry(ctx),
	};
};

export type InternalAdapter = ReturnType<typeof createRegistry>;
