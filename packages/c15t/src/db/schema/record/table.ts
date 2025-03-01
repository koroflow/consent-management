import type { Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { recordSchema } from '.';

/**
 * Generates the database table configuration for the consent record entity.
 *
 * This function creates a schema definition that includes all standard consent record fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain consent record table customizations
 * @param recordFields - Additional fields from plugins to include in the consent record table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const recordTableSchema = getRecordTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(recordTableSchema);
 * ```
 */
export function getRecordTable(
	options: C15TOptions,
	recordFields?: Record<string, Field>
) {
	return {
		/**
		 * The name of the consent record table in the database, configurable through options
		 */
		modelName: options.record?.modelName || 'record',

		/**
		 * The schema for the consent record table
		 */
		schema: recordSchema,

		/**
		 * Field definitions for the consent record table
		 */
		fields: {
			/**
			 * Reference to the user associated with this consent record
			 */
			userId: {
				type: 'string',
				required: true,
				fieldName: options.record?.fields?.userId || 'userId',
				references: {
					model: options.user?.modelName || 'user',
					field: 'id',
				},
			},

			/**
			 * Optional reference to the specific consent this record is about
			 * May be null for general consent actions not related to a specific consent
			 */
			consentId: {
				type: 'string',
				required: false,
				fieldName: options.record?.fields?.consentId || 'consentId',
				references: {
					model: options.consent?.modelName || 'consent',
					field: 'id',
				},
			},

			/**
			 * Type of consent action this record represents
			 * Common values: 'given', 'withdrawn', 'updated', 'expired', 'requested'
			 */
			actionType: {
				type: 'string',
				required: true,
				fieldName: options.record?.fields?.actionType || 'actionType',
			},

			/**
			 * Additional details about the consent action
			 * May include IP address, user agent, reason for withdrawal, etc.
			 */
			details: {
				type: 'string[]',
				required: false,
				fieldName: options.record?.fields?.details || 'details',
			},

			/**
			 * When the consent record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.record?.fields?.createdAt || 'createdAt',
			},

			// Include additional fields from plugins
			...recordFields,

			// Include additional fields from configuration
			...options.record?.additionalFields,
		},

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Consent record table needs to be created after the user and consent tables it references
		 */
		order: 7,
	};
}
