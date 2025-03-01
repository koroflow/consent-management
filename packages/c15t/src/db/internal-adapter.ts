import type {} from '~/types';

import type { Adapter, C15TContext, C15TOptions } from '~/types';

// Import adapters from their respective files
import { createUserAdapter } from './schema/user/adapter';
import { createConsentAdapter } from './schema/consent/adapter';
import { createConsentPurposeAdapter } from './schema/consent-purpose/adapter';
import { createConsentRecordAdapter } from './schema/consent-record/adapter';
import { createConsentAuditLogAdapter } from './schema/consent-audit-log/adapter';
import { createConsentWithdrawalAdapter } from './schema/consent-withdrawal/adapter';
import { getWithHooks } from './hooks';
import { createDomainAdapter } from './schema/domain/adapter';
import { createGeoLocationAdapter } from './schema/geo-location/adapter';
import { createConsentPurposeJunctionAdapter } from './schema/consent-purpose-junction/adapter';
import { createConsentGeoLocationAdapter } from './schema/consent-geo-location/adapter';

export const createInternalAdapter = (
	adapter: Adapter,
	ctx: {
		options: C15TOptions;
		hooks: Exclude<C15TOptions['databaseHooks'], undefined>[];
		generateId: C15TContext['generateId'];
	}
) => {
	const options = ctx.options;
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);

	// Create specialized adapters
	const userAdapter = createUserAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);
	const consentAdapter = createConsentAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);
	const purposeAdapter = createConsentPurposeAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);
	const recordAdapter = createConsentRecordAdapter(
		adapter,
		createWithHooks,
		options
	);
	const auditLogAdapter = createConsentAuditLogAdapter(
		adapter,
		createWithHooks,
		options
	);
	const withdrawalAdapter = createConsentWithdrawalAdapter(
		adapter,
		createWithHooks,
		options
	);

	const domainAdapter = createDomainAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);

	const geoLocationAdapter = createGeoLocationAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);

	const consentPurposeJunctionAdapter = createConsentPurposeJunctionAdapter(
		adapter,
		createWithHooks,
		updateWithHooks,
		options
	);

	const consentWithdrawalAdapter = createConsentWithdrawalAdapter(
		adapter,
		createWithHooks,
		options
	);

	const consentAuditLogAdapter = createConsentAuditLogAdapter(
		adapter,
		createWithHooks,
		options
	);

	const consentGeoLocationAdapter = createConsentGeoLocationAdapter(
		adapter,
		createWithHooks,
		options
	);

	return {
		...userAdapter,
		...consentAdapter,
		...recordAdapter,
		...purposeAdapter,
		...auditLogAdapter,
		...withdrawalAdapter,
		...domainAdapter,
		...geoLocationAdapter,
		...consentPurposeJunctionAdapter,
		...consentWithdrawalAdapter,
		...consentAuditLogAdapter,
		...consentGeoLocationAdapter,
	};
};

export type InternalAdapter = ReturnType<typeof createInternalAdapter>;
