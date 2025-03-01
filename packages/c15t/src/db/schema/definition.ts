import type { C15TOptions } from '~/types';
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
	getGeoLocationTable,
} from './index';
import type { PluginSchema } from '../core/types';

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
		geoLocation: getGeoLocationTable(options, geoLocation?.fields),
		...pluginTables,
	};
};

export type C15TDBSchema = ReturnType<typeof getConsentTables>;

/**
 * Generic type to get all fields of a table by its name
 *
 * @template T - The table name from C15TDBSchema
 * @example
 * ```typescript
 * type UserFields = TableFields<'user'>;
 * ```
 */
export type TableFields<T extends keyof C15TDBSchema> =
	C15TDBSchema[T]['fields'];

/**
 * Generic type to get all input fields of a table by its name
 *
 * @template T - The table name from C15TDBSchema
 * @example
 * ```typescript
 * type UserInputFields = TableInputFields<'user'>;
 * ```
 */
export type TableInputFields<T extends keyof C15TDBSchema> = {
	[K in keyof TableFields<T> as TableFields<T>[K] extends { input: false }
		? never
		: K]: TableFields<T>[K] extends { required: true }
		? unknown
		: unknown | undefined;
};

/**
 * Generic type to get all output fields of a table by its name
 *
 * @template T - The table name from C15TDBSchema
 * @example
 * ```typescript
 * type UserOutputFields = TableOutputFields<'user'>;
 * ```
 */
export type TableOutputFields<T extends keyof C15TDBSchema> = {
	[K in keyof TableFields<T> as TableFields<T>[K] extends { returned: false }
		? never
		: K]: TableFields<T>[K] extends { required: false }
		? unknown | null | undefined
		: unknown;
};

/**
 * Validates input data against table schema using Zod
 *
 * @template T - The table name from C15TDBSchema
 * @param tableName - The name of the table to validate against
 * @param data - The data to validate
 * @param options - The C15TOptions instance
 * @param action - Whether this is a create or update operation
 * @returns Validated and typed data
 *
 * @example
 * ```typescript
 * const validUserData = validateTableInput('user', inputData, options);
 * ```
 */
export function validateTableInput<T extends keyof C15TDBSchema>(
	tableName: T,
	data: Record<string, unknown>,
	options: C15TOptions,
	action: 'create' | 'update' = 'create'
): TableInputFields<T> {
	const tables = getConsentTables(options);
	const table = tables[tableName];

	if (!table) {
		throw new Error(`Table ${tableName} not found`);
	}

	// Import the parseInputData function to validate against schema
	const { parseInputData } = require('../schema');

	// Validate and return data
	return parseInputData(data, {
		fields: table.fields,
		action,
	}) as TableInputFields<T>;
}

/**
 * Validates output data against table schema using Zod
 *
 * @template T - The table name from C15TDBSchema
 * @param tableName - The name of the table to validate against
 * @param data - The data to validate
 * @param options - The C15TOptions instance
 * @returns Validated and typed data
 *
 * @example
 * ```typescript
 * const validUserOutput = validateTableOutput('user', outputData, options);
 * ```
 */
export function validateTableOutput<T extends keyof C15TDBSchema>(
	tableName: T,
	data: Record<string, unknown>,
	options: C15TOptions
): TableOutputFields<T> {
	const tables = getConsentTables(options);
	const table = tables[tableName];

	if (!table) {
		throw new Error(`Table ${tableName} not found`);
	}

	// Import the parseOutputData function to validate against schema
	const { parseOutputData } = require('../schema');

	// Validate and return data
	return parseOutputData(data, {
		fields: table.fields,
	}) as TableOutputFields<T>;
}
