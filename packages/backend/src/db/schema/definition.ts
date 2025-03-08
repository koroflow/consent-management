import type { C15TOptions } from '~/types';
import type { PluginSchema } from '../core/types';
import {
	getAuditLogTable,
	getConsentGeoLocationTable,
	getConsentPolicyTable,
	// getGeoLocationTable,
	getConsentRecordTable,
	getConsentTable,
	getConsentWithdrawalTable,
	getDomainTable,
	getGeoLocationTable,
	getPurposeJunctionTable,
	getPurposeTable,
	getSubjectTable,
} from './index';
import type { InferTableShape } from './schemas';

/**
 * Retrieves all consent-related database table definitions
 *
 * This function combines the core tables with any additional tables
 * defined by plugins. It handles merging plugin-defined fields with
 * the standard tables and ensures all table definitions are properly
 * structured for use by database adapters.
 *
 * @param options - The c15t configuration options
 * @returns A complete schema mapping containing all table definitions
 *
 * @remarks
 * Each table definition includes both field definitions and the physical
 * entity name used in the database. Plugins can extend core tables by
 * defining additional fields, which will be merged with the standard fields.
 *
 * @example
 * ```typescript
 * // Get all tables with default configuration
 * const tables = getConsentTables(options);
 *
 * // Access fields for the consent table
 * const consentFields = tables.consent.fields;
 * ```
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
				entityName: value.entityName || key,
			};
		}
		return acc;
	}, {} as PluginSchema);

	const {
		subject,
		consentPurpose,
		consentPolicy,
		domain,
		geoLocation,
		consent,
		consentPurposeJunction,
		record,
		consentGeoLocation,
		consentWithdrawal,
		auditLog,
		...pluginTables
	} = pluginSchema || {};

	return {
		subject: getSubjectTable(options, subject?.fields),
		consentPurpose: getPurposeTable(options, consentPurpose?.fields),
		consentPolicy: getConsentPolicyTable(options, consentPolicy?.fields),
		domain: getDomainTable(options, domain?.fields),
		consent: getConsentTable(options, consent?.fields),
		consentPurposeJunction: getPurposeJunctionTable(
			options,
			consentPurposeJunction?.fields
		),
		consentRecord: getConsentRecordTable(options, record?.fields),
		consentGeoLocation: getConsentGeoLocationTable(
			options,
			consentGeoLocation?.fields
		),
		consentWithdrawal: getConsentWithdrawalTable(
			options,
			consentWithdrawal?.fields
		),
		auditLog: getAuditLogTable(options, auditLog?.fields),
		geoLocation: getGeoLocationTable(options, geoLocation?.fields),
		...pluginTables,
	};
};

/**
 * Type representing the complete database schema for c15t
 *
 * This type captures the full structure of all tables in the database,
 * including core tables and any plugin-defined tables. It's derived from
 * the return type of `getConsentTables()`.
 *
 * @remarks
 * This is a key type for type-safety throughout the codebase, as it
 * ensures that table names and field references are validated at compile time.
 * It's used as a basis for many other type definitions in the database layer.
 *
 * @example
 * ```typescript
 * // Type-safe reference to a specific table
 * function processTable<TableName extends keyof C15TDBSchema>(
 *   tableName: TableName,
 *   data: Record<string, unknown>
 * ) {
 *   const tableFields = getConsentTables(options)[tableName].fields;
 *   // Process with type safety...
 * }
 * ```
 */
export type C15TDBSchema = ReturnType<typeof getConsentTables>;

/**
 * Type to get all output fields of a table by its name
 * This type extracts only the fields that are included in output operations,
 * automatically excluding fields marked with { returned: false }.
 * It also resolves relationships between tables.
 */
export type EntityOutputFields<TableName extends keyof C15TDBSchema> =
	InferTableShape<TableName>;

/**
 * Type to get all input fields of a table by its name
 * This type extracts only the fields that are allowed for input operations,
 * automatically excluding fields marked with { input: false }.
 */
export type EntityInputFields<TableName extends keyof C15TDBSchema> = Omit<
	InferTableShape<TableName>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * Validates output data against table schema using Zod
 *
 * This function validates and transforms output data according to the
 * schema definition for a specific table. It ensures that all values match
 * their expected types and excludes fields marked as not to be returned.
 *
 * @typeParam TableName - The table name from C15TDBSchema
 * @param tableName - The name of the table to validate against
 * @param data - The data to validate
 * @param options - The C15TOptions instance
 * @returns Validated and typed data
 * @throws {Error} If the table is not found or validation fails
 *
 * @remarks
 * This function is particularly useful for validating data received from
 * external sources or database adapters before processing it in application logic.
 *
 * @example
 * ```typescript
 * // Validate data retrieved from an external API
 * try {
 *   const validSubjectOutput = validateEntityOutput(
 *     'subject',
 *     fetchedSubjectData,
 *     options
 *   );
 *
 *   // validSubjectOutput is now typed as EntityOutputFields<'subject'>
 *   displaySubjectProfile(validSubjectOutput);
 * } catch (error) {
 *   console.error('Output validation failed:', error.message);
 * }
 * ```
 */
export function validateEntityOutput<TableName extends keyof C15TDBSchema>(
	tableName: TableName,
	data: Record<string, unknown>,
	options: C15TOptions
): EntityOutputFields<TableName> {
	const tables = getConsentTables(options);
	const table = tables[tableName];

	if (!table) {
		throw new Error(`Table ${tableName} not found`);
	}

	console.log(
		`🔎 DEBUG VALIDATE: Validating ${tableName} entity with direct date inspection`
	);

	// Check for and fix date fields that are strings but should be Date objects
	if (data && typeof data === 'object') {
		if ('createdAt' in data) {
			const createdAt = data.createdAt;
			console.log(
				'🔎 DEBUG VALIDATE: Inspecting createdAt value:',
				createdAt,
				'type:',
				typeof createdAt
			);
			console.log(
				'🔎 DEBUG VALIDATE: createdAt is Date?',
				createdAt instanceof Date
			);

			// If it's a string that looks like a date, convert it
			if (
				typeof createdAt === 'string' &&
				/^\d{4}-\d{2}-\d{2}/.test(createdAt)
			) {
				console.log('🔎 DEBUG VALIDATE: Converting string createdAt to Date');
				data.createdAt = new Date(createdAt);
				console.log(
					'🔎 DEBUG VALIDATE: After conversion:',
					data.createdAt,
					'type:',
					typeof data.createdAt
				);
				console.log(
					'🔎 DEBUG VALIDATE: Is now Date?',
					data.createdAt instanceof Date
				);
			}
		}

		if ('updatedAt' in data) {
			const updatedAt = data.updatedAt;
			console.log(
				'🔎 DEBUG VALIDATE: Inspecting updatedAt value:',
				updatedAt,
				'type:',
				typeof updatedAt
			);
			console.log(
				'🔎 DEBUG VALIDATE: updatedAt is Date?',
				updatedAt instanceof Date
			);

			// If it's a string that looks like a date, convert it
			if (
				typeof updatedAt === 'string' &&
				/^\d{4}-\d{2}-\d{2}/.test(updatedAt)
			) {
				console.log('🔎 DEBUG VALIDATE: Converting string updatedAt to Date');
				data.updatedAt = new Date(updatedAt);
				console.log(
					'🔎 DEBUG VALIDATE: After conversion:',
					data.updatedAt,
					'type:',
					typeof data.updatedAt
				);
				console.log(
					'🔎 DEBUG VALIDATE: Is now Date?',
					data.updatedAt instanceof Date
				);
			}
		}
	}

	// Log date fields for debugging
	if ('createdAt' in data) {
		console.log(
			`🔍 DEBUG validateEntityOutput: createdAt in data: ${data.createdAt} (${typeof data.createdAt})`
		);
		console.log(
			`🔍 DEBUG validateEntityOutput: createdAt is Date? ${data.createdAt instanceof Date}`
		);

		// Get the expected Zod schema for createdAt if available
		try {
			const schema = table.schema.shape;
			// Use optional chaining and type checks to avoid errors
			if (schema && typeof schema === 'object' && 'createdAt' in schema) {
				const createdAtSchema = schema.createdAt;
				if (
					createdAtSchema &&
					typeof createdAtSchema === 'object' &&
					'_def' in createdAtSchema
				) {
					// Now safely access the typeName
					const typeDef = createdAtSchema._def;
					if (typeDef && typeof typeDef === 'object' && 'typeName' in typeDef) {
						console.log(
							`🔍 DEBUG validateEntityOutput: createdAt schema type: ${typeDef.typeName}`
						);
					}
				}
			}
		} catch (err) {
			console.log(
				`🔍 DEBUG validateEntityOutput: Error accessing schema for createdAt: ${err}`
			);
		}
	}
	if ('updatedAt' in data) {
		console.log(
			`🔍 DEBUG validateEntityOutput: updatedAt in data: ${data.updatedAt} (${typeof data.updatedAt})`
		);
		console.log(
			`🔍 DEBUG validateEntityOutput: updatedAt is Date? ${data.updatedAt instanceof Date}`
		);

		// Get the expected Zod schema for updatedAt if available
		try {
			const schema = table.schema.shape;
			// Use optional chaining and type checks to avoid errors
			if (schema && typeof schema === 'object' && 'updatedAt' in schema) {
				const updatedAtSchema = schema.updatedAt;
				if (
					updatedAtSchema &&
					typeof updatedAtSchema === 'object' &&
					'_def' in updatedAtSchema
				) {
					// Now safely access the typeName
					const typeDef = updatedAtSchema._def;
					if (typeDef && typeof typeDef === 'object' && 'typeName' in typeDef) {
						console.log(
							`🔍 DEBUG validateEntityOutput: updatedAt schema type: ${typeDef.typeName}`
						);
					}
				}
			}
		} catch (err) {
			console.log(
				`🔍 DEBUG validateEntityOutput: Error accessing schema for updatedAt: ${err}`
			);
		}
	}

	try {
		// Validate and return data using Zod schema
		const result = table.schema.parse(data) as EntityOutputFields<TableName>;
		console.log(
			`🔍 DEBUG validateEntityOutput: Validation succeeded for ${tableName}`
		);
		return result;
	} catch (error) {
		console.error(
			`🔍 DEBUG validateEntityOutput: Validation failed for ${tableName}:`,
			error
		);
		// Log the error details if it's a Zod error
		if (error && typeof error === 'object' && 'errors' in error) {
			console.error('Zod validation errors details:');

			// Safely type the errors array with proper checks
			const errorObj = error as { errors?: unknown[] };
			const errors = Array.isArray(errorObj.errors) ? errorObj.errors : [];

			for (const err of errors) {
				if (err && typeof err === 'object') {
					// Safely access properties with optional chaining
					interface ZodErrorItem {
						path?: string[];
						expected?: string;
						received?: string;
						message?: string;
						code?: string;
					}

					// More specific typing for the error object
					const errorItem = err as Partial<ZodErrorItem>;
					const path = Array.isArray(errorItem.path)
						? errorItem.path.join('.')
						: 'unknown path';
					const expected = errorItem.expected || 'unknown';
					const received = errorItem.received || 'unknown';
					const message = errorItem.message || 'No error message';

					console.error(
						`- Path: ${path}, Expected: ${expected}, Received: ${received}`
					);
					console.error(`  Message: ${message}`);

					// Extra debugging for date fields
					if (path.includes('createdAt') || path.includes('updatedAt')) {
						const fieldName = path.split('.').pop() || '';
						if (fieldName && fieldName in data) {
							const fieldValue = data[fieldName];
							console.error(
								`  Value: ${fieldValue}, Type: ${typeof fieldValue}`
							);
							if (typeof fieldValue === 'string') {
								try {
									console.error(
										`  Trying to parse as Date: ${new Date(fieldValue)}`
									);
								} catch (parseErr) {
									console.error(`  Failed to parse as Date: ${parseErr}`);
								}
							}
						}
					}
				}
			}
		}
		throw error;
	}
}
