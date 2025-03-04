import type { Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { purposeSchema } from './schema';

/**
 * Generates the database table configuration for the consent purpose entity.
 *
 * This function creates a schema definition that includes all standard consent purpose fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain purpose table customizations
 * @param purposeFields - Additional fields from plugins to include in the purpose table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const purposeTableSchema = getPurposeTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(purposeTableSchema);
 * ```
 */
export function getPurposeTable(
	options: C15TOptions,
	purposeFields?: Record<string, Field>
) {
	const purposeConfig = options.tables?.purpose;

	return {
		/**
		 * The name of the purpose table in the database, configurable through options
		 */
		entityName: purposeConfig?.entityName || 'purpose',

		/**
		 * The ID prefix for the purpose table
		 * Used to generate unique prefixed IDs for purposes
		 */
		entityPrefix: purposeConfig?.entityPrefix || 'pur',

		/**
		 * The schema for the purpose table
		 */
		schema: purposeSchema,

		/**
		 * Field definitions for the consent purpose table
		 */
		fields: {
			/**
			 * Unique code for the purpose, used for programmatic identification
			 */
			code: {
				type: 'string',
				required: true,
				fieldName: purposeConfig?.fields?.code || 'code',
			},

			/**
			 * Human-readable name of the purpose
			 */
			name: {
				type: 'string',
				required: true,
				fieldName: purposeConfig?.fields?.name || 'name',
			},

			/**
			 * Detailed description of the purpose, shown to users
			 */
			description: {
				type: 'string',
				required: true,
				fieldName: purposeConfig?.fields?.description || 'description',
			},

			/**
			 * Whether this is an essential purpose that doesn't require explicit consent
			 * Default: false
			 */
			isEssential: {
				type: 'boolean',
				defaultValue: () => false,
				required: true,
				fieldName: purposeConfig?.fields?.isEssential || 'isEssential',
			},

			/**
			 * Category of data this purpose processes (e.g., 'personal', 'profile')
			 * Optional field
			 */
			dataCategory: {
				type: 'string',
				required: false,
				fieldName: purposeConfig?.fields?.dataCategory || 'dataCategory',
			},

			/**
			 * Legal basis for data processing (e.g., 'consent', 'legitimate interest')
			 * Optional field
			 */
			legalBasis: {
				type: 'string',
				required: false,
				fieldName: purposeConfig?.fields?.legalBasis || 'legalBasis',
			},

			/**
			 * Whether this purpose is currently active
			 * Default: true
			 */
			isActive: {
				type: 'boolean',
				defaultValue: true,
				required: true,
				fieldName: purposeConfig?.fields?.isActive || 'isActive',
			},

			/**
			 * When the purpose record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: purposeConfig?.fields?.createdAt || 'createdAt',
			},

			/**
			 * When the purpose record was last updated
			 * Automatically updated on each modification
			 */
			updatedAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: purposeConfig?.fields?.updatedAt || 'updatedAt',
			},

			// Include additional fields from plugins
			...(purposeFields || {}),

			// Include additional fields from configuration
			...(purposeConfig?.additionalFields || {}),
		},

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Purpose table needs to be created relatively early as other tables reference it
		 */
		order: 2,
	};
}
