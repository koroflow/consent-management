// packages/c15t/src/db/schema/definition.ts

import type { C15TOptions } from '~/types';
import type { PluginSchema } from './types';

import {
	getUserTable,
	getPurposeTable,
	getConsentGeoLocationTable,
	getConsentPolicyTable,
	getDomainTable,
	getConsentTable,
	getPurposeJunctionTable,
	// getGeoLocationTable,
	getRecordTable,
	getWithdrawalTable,
	getAuditLogTable,
} from './index';

/**
 * Get all consent-related tables
 */
export const getConsentTables = (options: C15TOptions) => {
	const pluginSchema = options.plugins?.reduce((acc, plugin) => {
		const schema = plugin.schema;
		if (!schema) {
			return acc;
		}
		for (const [key, value] of Object.entries(schema)) {
			acc[key] = {
				fields: {
					...acc[key]?.fields,
					...value.fields,
				},
				modelName: value.modelName || key,
			};
		}
		return acc;
	}, {} as PluginSchema);

	const {
		user,
		purpose,
		consentPolicy,
		domain,
		geoLocation,
		consent,
		purposeJunction,
		record,
		consentGeoLocation,
		withdrawal,
		auditLog,
		...pluginTables
	} = pluginSchema || {};

	return {
		user: getUserTable(options, user?.fields),
		purpose: getPurposeTable(options, purpose?.fields),
		consentPolicy: getConsentPolicyTable(options, consentPolicy?.fields),
		domain: getDomainTable(options, domain?.fields),
		consent: getConsentTable(options, consent?.fields),
		purposeJunction: getPurposeJunctionTable(options, purposeJunction?.fields),
		record: getRecordTable(options, record?.fields),
		consentGeoLocation: getConsentGeoLocationTable(
			options,
			consentGeoLocation?.fields
		),
		withdrawal: getWithdrawalTable(options, withdrawal?.fields),
		auditLog: getAuditLogTable(options, auditLog?.fields),
		// geoLocation: getGeoLocationTable(options, geoLocation?.fields),
		...pluginTables,
	};
};

export type C15TDBSchema = ReturnType<typeof getConsentTables>;
