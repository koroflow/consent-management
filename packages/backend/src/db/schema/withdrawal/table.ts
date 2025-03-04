import type { Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { withdrawalSchema } from './schema';

/**
 * Generates the database table configuration for the consent withdrawal entity.
 *
 * This function creates a schema definition that includes all standard withdrawal fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain withdrawal table customizations
 * @param withdrawalFields - Additional fields from plugins to include in the withdrawal table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const withdrawalTableSchema = getWithdrawalTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(withdrawalTableSchema);
 * ```
 */
export function getWithdrawalTable(
	options: C15TOptions,
	withdrawalFields?: Record<string, Field>
) {
	const withdrawalConfig = options.tables?.withdrawal;
	const consentConfig = options.tables?.consent;
	const userConfig = options.tables?.user;

	return {
		/**
		 * The name of the withdrawal table in the database, configurable through options
		 */
		entityName: withdrawalConfig?.entityName || 'withdrawal',

		/**
		 * The ID prefix for the withdrawal table
		 * Used to generate unique prefixed IDs for withdrawals
		 */
		entityPrefix: withdrawalConfig?.entityPrefix || 'wdr',

		/**
		 * The schema for the consent withdrawal table
		 */
		schema: withdrawalSchema,

		/**
		 * Field definitions for the consent withdrawal table
		 */
		fields: {
			/**
			 * Reference to the consent that was withdrawn
			 */
			consentId: {
				type: 'string',
				required: true,
				fieldName: withdrawalConfig?.fields?.consentId || 'consentId',
				references: {
					model: consentConfig?.entityName || 'consent',
					field: 'id',
				},
			},

			/**
			 * Reference to the user who withdrew consent
			 */
			userId: {
				type: 'string',
				required: true,
				fieldName: withdrawalConfig?.fields?.userId || 'userId',
				references: {
					model: userConfig?.entityName || 'user',
					field: 'id',
				},
			},

			/**
			 * Reason provided for withdrawing consent
			 */
			withdrawalReason: {
				type: 'string',
				required: false,
				fieldName:
					withdrawalConfig?.fields?.withdrawalReason || 'withdrawalReason',
			},

			/**
			 * Method by which consent was withdrawn
			 * Common values: 'user-initiated', 'automatic-expiry', 'admin'
			 */
			withdrawalMethod: {
				type: 'string',
				defaultValue: () => 'user-initiated',
				required: true,
				fieldName:
					withdrawalConfig?.fields?.withdrawalMethod || 'withdrawalMethod',
			},

			/**
			 * IP address from which the withdrawal was initiated
			 */
			ipAddress: {
				type: 'string',
				required: false,
				fieldName: withdrawalConfig?.fields?.ipAddress || 'ipAddress',
			},

			/**
			 * User agent (browser/device) from which the withdrawal was initiated
			 */
			userAgent: {
				type: 'string',
				required: false,
				fieldName: withdrawalConfig?.fields?.userAgent || 'userAgent',
			},

			/**
			 * Additional metadata about the withdrawal
			 */
			metadata: {
				type: 'json',
				required: false,
				fieldName: withdrawalConfig?.fields?.metadata || 'metadata',
			},

			/**
			 * When the withdrawal record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: withdrawalConfig?.fields?.createdAt || 'createdAt',
			},

			// Include additional fields from plugins
			...(withdrawalFields || {}),

			// Include additional fields from configuration
			...(withdrawalConfig?.additionalFields || {}),
		},

		/**
		 * Add unique constraint to ensure a consent can only be withdrawn once
		 * (If this constraint is not desired, it can be disabled in options)
		 */
		uniqueConstraints:
			withdrawalConfig?.preventMultipleWithdrawals !== false
				? [
						{
							name: 'unique_consent_withdrawal',
							fields: ['consentId'],
						},
					]
				: [],

		/**
		 * Add indexes for better query performance
		 */
		indexes: [
			{
				name: 'user_id_index',
				fields: ['userId'],
			},
			{
				name: 'created_at_index',
				fields: ['createdAt'],
			},
		],

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Withdrawal table needs to be created after the consent and user tables it references
		 */
		order: 7,
	};
}
