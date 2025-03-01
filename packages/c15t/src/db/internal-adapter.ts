import type { Adapter, C15TContext, C15TOptions } from '~/types';

// Import adapters from their respective files
import { createUserAdapter } from './schema/user/adapter';
import { createConsentAdapter } from './schema/consent/adapter';
import { createConsentPurposeAdapter } from './schema/consent-purpose/adapter';
import { createConsentRecordAdapter } from './schema/consent-record/adapter';
import { createConsentAuditLogAdapter } from './schema/consent-audit-log/adapter';
import { createDomainAdapter } from './schema/domain/adapter';
import { createGeoLocationAdapter } from './schema/geo-location/adapter';
import { createConsentPurposeJunctionAdapter } from './schema/consent-purpose-junction/adapter';
import { createConsentWithdrawalAdapter } from './schema/consent-withdrawal/adapter';
import { createConsentGeoLocationAdapter } from './schema/consent-geo-location/adapter';

export type InternalAdapterContext = {
	adapter: Adapter;
	ctx: {
		options: C15TOptions;
		hooks: Exclude<C15TOptions['databaseHooks'], undefined>[];
		generateId: C15TContext['generateId'];
	};
};

export const createInternalAdapter = ({
	adapter,
	ctx,
}: InternalAdapterContext) => {
	return {
		...createUserAdapter({ adapter, ctx }),
		...createConsentAdapter({ adapter, ctx }),
		...createConsentRecordAdapter({ adapter, ctx }),
		...createConsentPurposeAdapter({ adapter, ctx }),
		...createConsentAuditLogAdapter({ adapter, ctx }),
		...createConsentWithdrawalAdapter({ adapter, ctx }),
		...createDomainAdapter({ adapter, ctx }),
		...createGeoLocationAdapter({ adapter, ctx }),
		...createConsentPurposeJunctionAdapter({ adapter, ctx }),
		...createConsentWithdrawalAdapter({ adapter, ctx }),
		...createConsentAuditLogAdapter({ adapter, ctx }),
		...createConsentGeoLocationAdapter({ adapter, ctx }),
	};
};

export type InternalAdapter = ReturnType<typeof createInternalAdapter>;
