import type { FieldAttribute } from '~/db/fields';
import type { C15TDbSchema } from '~/db/get-tables';
import type { C15TOptions } from '~/types';

/**
 * Generates the database table configuration for the consent-purpose junction entity.
 *
 * This function creates a schema definition that implements a many-to-many relationship
 * between consents and purposes. The resulting schema is used for database migrations,
 * schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain junction table customizations
 * @param junctionFields - Additional fields from plugins to include in the junction table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const junctionTableSchema = getConsentPurposeJunctionTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(junctionTableSchema);
 * ```
 */
export function getConsentPurposeJunctionTable(
	options: C15TOptions,
	junctionFields?: Record<string, FieldAttribute>
): C15TDbSchema['consentPurposeJunction'] {
	return {
		/**
		 * The name of the junction table in the database, configurable through options
		 */
		modelName:
			options.consentPurposeJunction?.modelName || 'consentPurposeJunction',

		/**
		 * Field definitions for the consent-purpose junction table
		 */
		fields: {
			/**
			 * Reference to the consent record this junction is associated with
			 */
			consentId: {
				type: 'string',
				required: true,
				fieldName:
					options.consentPurposeJunction?.fields?.consentId || 'consentId',
				references: {
					model: options.consent?.modelName || 'consent',
					field: 'id',
				},
			},

			/**
			 * Reference to the purpose record this junction is associated with
			 */
			purposeId: {
				type: 'string',
				required: true,
				fieldName:
					options.consentPurposeJunction?.fields?.purposeId || 'purposeId',
				references: {
					model: options.consentPurpose?.modelName || 'consentPurpose',
					field: 'id',
				},
			},

			/**
			 * Status of this specific consent-purpose relationship
			 * Default: 'active'
			 */
			status: {
				type: 'string',
				defaultValue: () => 'active',
				required: true,
				fieldName: options.consentPurposeJunction?.fields?.status || 'status',
			},

			/**
			 * Additional metadata about this specific consent-purpose relationship
			 */
			metadata: {
				type: 'string[]',
				required: false,
				fieldName:
					options.consentPurposeJunction?.fields?.metadata || 'metadata',
			},

			/**
			 * When the junction record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName:
					options.consentPurposeJunction?.fields?.createdAt || 'createdAt',
			},

			/**
			 * When the junction record was last updated
			 * Optional, set during updates
			 */
			updatedAt: {
				type: 'date',
				required: false,
				fieldName:
					options.consentPurposeJunction?.fields?.updatedAt || 'updatedAt',
			},

			// Include additional fields from plugins
			...junctionFields,

			// Include additional fields from configuration
			...options.consentPurposeJunction?.additionalFields,
		},

		/**
		 * Add unique constraint to ensure a purpose can only be associated with a consent once
		 */
		uniqueConstraints: [
			{
				name: 'unique_consent_purpose',
				fields: ['consentId', 'purposeId'],
			},
		],

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Junction table needs to be created after the consent and purpose tables it references
		 */
		order: 6,
	};
}
