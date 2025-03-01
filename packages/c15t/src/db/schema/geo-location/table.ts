import type { FieldAttribute } from '~/db/core/fields';
import type { C15TOptions } from '~/types';

/**
 * Generates the database table configuration for the geo-location entity.
 *
 * This function creates a schema definition that includes all standard geo-location fields
 * and any additional fields from plugins or configuration. The resulting schema is used
 * for database migrations, schema validation, and query building.
 *
 * @param options - C15T configuration options that may contain geo-location table customizations
 * @param geoLocationFields - Additional fields from plugins to include in the geo-location table
 * @returns A complete table schema definition with fields, model name, and metadata
 *
 * @example
 * ```typescript
 * const locationTableSchema = getGeoLocationTable(c15tOptions);
 * // Use the schema for migrations or data access
 * const migrationPlans = generateMigrations(locationTableSchema);
 * ```
 */
export function getGeoLocationTable(
	options: C15TOptions,
	geoLocationFields?: Record<string, FieldAttribute>
) {
	return {
		/**
		 * The name of the geo-location table in the database, configurable through options
		 */
		modelName: options.geoLocation?.modelName || 'geoLocation',

		/**
		 * Field definitions for the geo-location table
		 */
		fields: {
			/**
			 * Country code (e.g., 'US', 'DE', 'FR')
			 */
			countryCode: {
				type: 'string',
				required: true,
				fieldName: options.geoLocation?.fields?.countryCode || 'countryCode',
			},

			/**
			 * Full country name (e.g., 'United States', 'Germany', 'France')
			 */
			countryName: {
				type: 'string',
				required: true,
				fieldName: options.geoLocation?.fields?.countryName || 'countryName',
			},

			/**
			 * Region or state code (e.g., 'CA', 'NY', 'BY')
			 */
			regionCode: {
				type: 'string',
				required: false,
				fieldName: options.geoLocation?.fields?.regionCode || 'regionCode',
			},

			/**
			 * Full region or state name (e.g., 'California', 'New York', 'Bavaria')
			 */
			regionName: {
				type: 'string',
				required: false,
				fieldName: options.geoLocation?.fields?.regionName || 'regionName',
			},

			/**
			 * Array of regulatory zones that apply to this location (e.g., 'GDPR', 'CCPA')
			 * Stored as a JSON string in the database
			 */
			regulatoryZones: {
				type: 'string[]',
				required: false,
				fieldName:
					options.geoLocation?.fields?.regulatoryZones || 'regulatoryZones',
				// transformer: {
				// 	input: (value: string[]) => JSON.stringify(value),
				// 	output: (value: string) => {
				// 		try {
				// 			return JSON.parse(value);
				// 		} catch (e) {
				// 			return [];
				// 		}
				// 	},
				// },
			},

			/**
			 * When the geo-location record was created
			 * Automatically set to current time by default
			 */
			createdAt: {
				type: 'date',
				defaultValue: () => new Date(),
				required: true,
				fieldName: options.geoLocation?.fields?.createdAt || 'createdAt',
			},

			// Include additional fields from plugins
			...geoLocationFields,

			// Include additional fields from configuration
			...options.geoLocation?.additionalFields,
		},

		/**
		 * Add indexes for better query performance
		 */
		// indexes: [
		// 	{
		// 		name: 'country_code_index',
		// 		fields: ['countryCode'],
		// 	},
		// 	{
		// 		name: 'region_code_index',
		// 		fields: ['regionCode'],
		// 	},
		// 	{
		// 		name: 'created_at_index',
		// 		fields: ['createdAt'],
		// 	},
		// ],

		/**
		 * Execution order during migrations (lower numbers run first)
		 * Geo-location is a base entity that doesn't depend on other tables
		 */
		order: 2,
	};
}
