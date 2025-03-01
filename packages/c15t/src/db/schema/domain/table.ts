import type { Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { domainSchema } from './schema';

/**
 * Generates the database table configuration for the domain entity.
 *
 * This function creates a schema definition that includes all standard domain fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain domain table customizations
 * @param domainFields - Additional fields from plugins to include in the domain table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const domainTableSchema = getDomainTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(domainTableSchema);
 * ```
 */
export function getDomainTable(
	options: C15TOptions,
	domainFields?: Record<string, Field>
) {
	return {
		/**
		 * The name of the domain table in the database, configurable through options
		 */
		modelName: options.domain?.modelName || 'domain',

		/**
		 * The schema for the domain table
		 */
		schema: domainSchema,

		/**
		 * Field definitions for the domain table
		 */
		fields: {
			/**
			 * Domain name (e.g., "example.com")
			 * This is the primary identifier for the domain in addition to its ID
			 */
			name: {
				type: 'string',
				required: true,
				unique: true,
				fieldName: options.domain?.fields?.name || 'name',
			},

			/**
			 * Optional human-readable description of the domain
			 */
			description: {
				type: 'string',
				required: false,
				fieldName: options.domain?.fields?.description || 'description',
			},

			/**
			 * List of additional origins that are allowed to access resources for this domain
			 * Stored as a JSON array of strings
			 */
			allowedOrigins: {
				type: 'string[]',
				defaultValue: () => [],
				required: false,
				fieldName: options.domain?.fields?.allowedOrigins || 'allowedOrigins',
			},

			/**
			 * Whether domain ownership has been verified
			 * Default: true
			 */
			isVerified: {
				type: 'boolean',
				defaultValue: () => true,
				required: true,
				fieldName: options.domain?.fields?.isVerified || 'isVerified',
			},

			/**
			 * Whether this domain is currently active
			 * Default: true
			 */
			isActive: {
				type: 'boolean',
				defaultValue: () => true,
				required: true,
				fieldName: options.domain?.fields?.isActive || 'isActive',
			},

			/**
			 * When the domain record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.domain?.fields?.createdAt || 'createdAt',
			},

			/**
			 * When the domain record was last updated
			 * Optional, set during updates
			 */
			updatedAt: {
				type: 'date',
				required: false,
				fieldName: options.domain?.fields?.updatedAt || 'updatedAt',
			},

			// Include additional fields from plugins
			...domainFields,

			// Include additional fields from configuration
			...options.domain?.additionalFields,
		},

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Domain table needs to be created before tables that reference it
		 */
		order: 2,
	};
}
