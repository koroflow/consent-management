import type { Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { consentSchema } from './schema';

/**
 * Generates the database table configuration for the consent entity.
 *
 * This function creates a schema definition that includes all standard consent fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain consent table customizations
 * @param consentFields - Additional fields from plugins to include in the consent table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const consentTableSchema = getConsentTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(consentTableSchema);
 * ```
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: needed for readability
export function getConsentTable(
	options: C15TOptions,
	consentFields?: Record<string, Field>
) {
	return {
		/**
		 * The name of the consent table in the database, configurable through options
		 */
		entityName: options.consent?.entityName || 'consent',

		/**
		 * The schema for the consent table
		 */
		schema: consentSchema,

		/**
		 * Field definitions for the consent table
		 */
		fields: {
			/**
			 * Reference to the user who gave consent
			 */
			userId: {
				type: 'string',
				required: true,
				fieldName: options.consent?.fields?.userId || 'userId',
				references: {
					model: options.user?.entityName || 'user',
					field: 'id',
				},
			},

			/**
			 * Reference to the domain for which consent was given
			 */
			domainId: {
				type: 'string',
				required: true,
				fieldName: options.consent?.fields?.domainId || 'domainId',
				references: {
					model: options.domain?.entityName || 'domain',
					field: 'id',
				},
			},

			/**
			 * Array of consent purpose IDs that the user has consented to
			 */
			purposeIds: {
				type: 'string[]',
				required: true,
				fieldName: options.consent?.fields?.purposeIds || 'purposeIds',
			},

			/**
			 * Optional reference to the policy version that was active when consent was given
			 */
			policyId: {
				type: 'string',
				required: false,
				fieldName: options.consent?.fields?.policyId || 'policyId',
				references: {
					model: options.consentPolicy?.entityName || 'consentPolicy',
					field: 'id',
				},
			},

			/**
			 * Status of the consent
			 * Default: 'active'
			 */
			status: {
				type: 'string',
				defaultValue: () => 'active',
				required: true,
				fieldName: options.consent?.fields?.status || 'status',
			},

			/**
			 * Optional reason provided when consent was withdrawn
			 */
			withdrawalReason: {
				type: 'string',
				required: false,
				fieldName:
					options.consent?.fields?.withdrawalReason || 'withdrawalReason',
			},

			/**
			 * IP address from which the consent was given
			 */
			ipAddress: {
				type: 'string',
				required: false,
				fieldName: options.consent?.fields?.ipAddress || 'ipAddress',
			},

			/**
			 * User agent (browser/device) from which the consent was given
			 */
			userAgent: {
				type: 'string',
				required: false,
				fieldName: options.consent?.fields?.userAgent || 'userAgent',
			},

			/**
			 * Additional metadata about the consent (customizable)
			 */
			metadata: {
				type: 'string[]',
				required: false,
				fieldName: options.consent?.fields?.metadata || 'metadata',
			},

			/**
			 * When the consent record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.consent?.fields?.createdAt || 'createdAt',
			},

			/**
			 * When the consent record was last updated
			 * Optional, set during updates
			 */
			updatedAt: {
				type: 'date',
				required: false,
				fieldName: options.consent?.fields?.updatedAt || 'updatedAt',
			},

			/**
			 * When the consent expires, if applicable
			 */
			expiresAt: {
				type: 'date',
				required: false,
				fieldName: options.consent?.fields?.expiresAt || 'expiresAt',
			},

			// Include additional fields from plugins
			...consentFields,

			// Include additional fields from configuration
			...options.consent?.additionalFields,
		},

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Consent table needs to be created after the user, domain and policy tables it references
		 */
		order: 5,
	};
}
