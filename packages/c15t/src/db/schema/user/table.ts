import { COMMON_TIMEZONES, type Field } from '~/db/core/fields';
import type { C15TOptions } from '~/types';
import { userSchema } from './schema';

/**
 * Generates the database table configuration for the user entity.
 *
 * This function creates a schema definition that includes all standard user fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain user table customizations
 * @param userFields - Additional fields from plugins to include in the user table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const userTableSchema = getUserTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(userTableSchema);
 * ```
 */
export function getUserTable(
	options: C15TOptions,
	userFields?: Record<string, Field>
) {
	return {
		/**
		 * The name of the user table in the database, configurable through options
		 */
		entityName: options.user?.entityName || 'user',

		/**
		 * The schema for the user table
		 */
		schema: userSchema,

		/**
		 * Field definitions for the user table
		 */
		fields: {
			/**
			 * Whether the user has been identified/verified
			 * Default: false
			 */
			isIdentified: {
				type: 'boolean',
				defaultValue: () => false,
				required: true,
				fieldName: options.user?.fields?.isIdentified || 'isIdentified',
			},

			/**
			 * External identifier for the user (from auth providers)
			 * Optional field
			 */
			externalId: {
				type: 'string',
				required: false,
				fieldName: options.user?.fields?.externalId || 'externalId',
			},

			/**
			 * The provider that identified this user (e.g., 'auth0', 'okta')
			 * Optional field
			 */
			identityProvider: {
				type: 'string',
				required: false,
				fieldName: options.user?.fields?.identityProvider || 'identityProvider',
			},

			/**
			 * Last known IP address of the user
			 * Optional field, useful for security and audit purposes
			 */
			lastIpAddress: {
				type: 'string',
				required: false,
				fieldName: options.user?.fields?.lastIpAddress || 'lastIpAddress',
			},

			/**
			 * When the user record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.user?.fields?.createdAt || 'createdAt',
			},

			/**
			 * When the user record was last updated
			 * Automatically updated on each modification
			 */
			updatedAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.user?.fields?.updatedAt || 'updatedAt',
			},

			/**
			 * User's local timezone, stored as IANA timezone identifier
			 */
			userTimezone: {
				type: 'timezone',
				required: false,
				defaultValue: COMMON_TIMEZONES.UTC,
				fieldName: options.user?.fields?.userTimezone || 'userTimezone',
			},

			// Include additional fields from plugins
			...userFields,

			// Include additional fields from configuration
			...options.user?.additionalFields,
		},

		/**
		 * Execution order during migrations (lower numbers run first)
		 * User table needs to be created before tables that reference it
		 */
		order: 1,
	};
}
