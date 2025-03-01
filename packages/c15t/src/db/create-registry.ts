import type { Adapter, C15TContext } from '~/types';

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

import type { HookContext } from './hooks/with-hooks-factory';

export type InternalAdapterContext = {
	adapter: Adapter;
	ctx: HookContext & {
		generateId: C15TContext['generateId'];
	};
};

export const createRegistry = ({ adapter, ctx }: InternalAdapterContext) => {
	return {
		...auditLogRegistry({ adapter, ctx }),
		...consentRegistry({ adapter, ctx }),
		...domainRegistry({ adapter, ctx }),
		...geoLocationRegistry({ adapter, ctx }),
		...purposeJunctionRegistry({ adapter, ctx }),
		...purposeRegistry({ adapter, ctx }),
		...recordRegistry({ adapter, ctx }),
		...userRegistry({ adapter, ctx }),
		...withdrawalRegistry({ adapter, ctx }),
		...withdrawalRegistry({ adapter, ctx }),
	};
};

export type InternalAdapter = ReturnType<typeof createRegistry>;
