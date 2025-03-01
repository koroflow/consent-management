import type { C15TOptions } from '~/types';
import { getUserTable } from './schema/user/table';
import type { FieldAttribute } from './fields';
import { getConsentPurposeTable } from './schema/consent-purpose/table';
import { getConsentPolicyTable } from './schema/consent-policy/table';
import { getConsentGeoLocationTable } from './schema/consent-geo-location/table';
import { getDomainTable } from './schema/domain/table';
import { getConsentTable } from './schema/consent/table';
import { getConsentPurposeJunctionTable } from './schema/consent-purpose-junction/table';
import { getConsentRecordTable } from './schema/consent-record/table';
import { getConsentWithdrawalTable } from './schema/consent-withdrawal/table';
import { getConsentAuditLogTable } from './schema/consent-audit-log/table';
import { getGeoLocationTable } from './schema/geo-location/table';

export type C15TDbSchema = Record<
	string,
	{
		/**
		 * The name of the table in the database
		 */
		modelName: string;
		/**
		 * The fields of the table
		 */
		fields: Record<string, FieldAttribute>;
		/**
		 * Whether to disable migrations for this table
		 * @default false
		 */
		disableMigrations?: boolean;
		/**
		 * The order of the table
		 */
		order?: number;
	}
>;

/**
 * Get all consent-related tables
 */
export const getConsentTables = (options: C15TOptions): C15TDbSchema => {
	const pluginSchema = options.plugins?.reduce(
		(acc, plugin) => {
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
		},
		{} as Record<
			string,
			{ fields: Record<string, FieldAttribute>; modelName: string }
		>
	);

	const {
		user,
		consentPurpose,
		consentPolicy,
		domain,
		geoLocation,
		consent,
		consentPurposeJunction,
		consentRecord,
		consentGeoLocation,
		consentWithdrawal,
		consentAuditLog,
		...pluginTables
	} = pluginSchema || {};

	return {
		user: getUserTable(options, user?.fields),
		consentPurpose: getConsentPurposeTable(options, consentPurpose?.fields),
		consentPolicy: getConsentPolicyTable(options, consentPolicy?.fields),
		domain: getDomainTable(options, domain?.fields),
		consent: getConsentTable(options, consent?.fields),
		consentPurposeJunction: getConsentPurposeJunctionTable(
			options,
			consentPurposeJunction?.fields
		),
		consentRecord: getConsentRecordTable(options, consentRecord?.fields),
		consentGeoLocation: getConsentGeoLocationTable(
			options,
			consentGeoLocation?.fields
		),
		consentWithdrawal: getConsentWithdrawalTable(
			options,
			consentWithdrawal?.fields
		),
		consentAuditLog: getConsentAuditLogTable(options, consentAuditLog?.fields),
		geoLocation: getGeoLocationTable(options, geoLocation?.fields),
		...pluginTables,
	} satisfies C15TDbSchema;
};
