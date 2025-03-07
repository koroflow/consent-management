import type { RegistryContext } from '~/types/context';

import {
	auditLogRegistry,
	consentGeoLocationRegistry,
	consentRegistry,
	domainRegistry,
	geoLocationRegistry,
	policyRegistry,
	consentPurposeJunctionRegistry,
	consentPurposeRegistry,
	consentRecordRegistry,
	subjectRegistry,
	consentWithdrawalRegistry,
} from './schema/index';

export const createRegistry = (ctx: RegistryContext) => {
	return {
		...auditLogRegistry(ctx),
		...consentRegistry(ctx),
		...domainRegistry(ctx),
		...geoLocationRegistry(ctx),
		...consentGeoLocationRegistry(ctx),
		...consentPurposeJunctionRegistry(ctx),
		...consentPurposeRegistry(ctx),
		...policyRegistry(ctx),
		...consentRecordRegistry(ctx),
		...subjectRegistry(ctx),
		...consentWithdrawalRegistry(ctx),
	};
};
