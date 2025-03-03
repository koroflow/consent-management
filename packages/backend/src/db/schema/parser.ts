import type { Field } from '../core/fields';
import type { C15TOptions, C15TPluginSchema } from '~/types';
import { APIError } from 'better-call';

/**
 * Parses and transforms output data according to schema field definitions.
 *
 * This function filters and processes entity data being returned from the database,
 * ensuring that only fields marked as returnable are included in the output.
 *
 * @typeParam EntityType - The type of entity being processed
 *
 * @param data - The raw data object retrieved from the database
 * @param schema - The schema containing field definitions
 * @param schema.fields - Record of field definitions for the entity
 *
 * @returns The processed data object with appropriate fields included or excluded
 *
 * @example
 * ```typescript
 * // Get user data from database
 * const userData = { id: '123', email: 'user@example.com', password: 'hash123' };
 *
 * // Define schema with password field marked as not returnable
 * const userSchema = {
 *   fields: {
 *     id: { name: 'id', type: 'string', returned: true },
 *     email: { name: 'email', type: 'string', returned: true },
 *     password: { name: 'password', type: 'string', returned: false }
 *   }
 * };
 *
 * // Process the data - password will be excluded
 * const processedData = parseEntityOutputData(userData, userSchema);
 * // Result: { id: '123', email: 'user@example.com' }
 * ```
 *
 * @remarks
 * - Fields marked with `returned: false` will be excluded from the output
 * - Fields not found in the schema will be passed through unchanged
 * - The function preserves the original type of the input data
 */
export function parseEntityOutputData<
	EntityType extends Record<string, unknown>,
>(
	data: EntityType,
	schema: {
		fields: Record<string, Field>;
	}
) {
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};

	for (const key in data) {
		if (Object.hasOwn(data, key)) {
			const field = fields[key];
			if (!field) {
				parsedData[key] = data[key];
				continue;
			}
			if (field.returned === false) {
				continue;
			}
			parsedData[key] = data[key];
		}
	}
	return parsedData as EntityType;
}

/**
 * Retrieves all fields for a specific table, combining base configuration and plugin fields
 *
 * @param options - The C15T configuration options
 * @param table - The table name to get fields for
 * @returns Combined fields from configuration and plugins
 */
export function getAllFields(options: C15TOptions, table: string) {
	let schema: Record<string, Field> = {};

	// Get additional fields from the tables configuration if available
	if (options.tables && table in options.tables) {
		const tableConfig = options.tables[table as keyof typeof options.tables];
		if (tableConfig?.additionalFields) {
			schema = { ...schema, ...tableConfig.additionalFields };
		}
	}

	// Add fields from plugins
	for (const plugin of options.plugins || []) {
		const pluginSchema = plugin.schema as C15TPluginSchema | undefined;
		if (pluginSchema?.[table]) {
			schema = {
				...schema,
				...pluginSchema[table].fields,
			};
		}
	}

	return schema;
}

/**
 * Parses and validates input data according to schema field definitions.
 *
 * This function processes data being sent to the database, ensuring it meets
 * schema requirements by:
 * - Validating required fields
 * - Applying transformations
 * - Setting default values
 * - Handling field-specific validation
 *
 * @typeParam EntityType - The type of entity being processed
 *
 * @param data - The input data to validate and transform
 * @param schema - The schema to validate against
 * @param schema.fields - Record of field definitions
 * @param schema.action - The current operation ('create' or 'update')
 *
 * @returns The validated and transformed data
 *
 * @throws {APIError} When a required field is missing during creation
 *
 * @example
 * ```typescript
 * // Input data from client
 * const inputData = {
 *   email: 'user@example.com',
 *   role: 'user'
 * };
 *
 * // Schema with field definitions
 * const userSchema = {
 *   fields: {
 *     id: {
 *       name: 'id',
 *       type: 'string',
 *       defaultValue: () => crypto.randomUUID()
 *     },
 *     email: {
 *       name: 'email',
 *       type: 'string',
 *       required: true,
 *       transform: {
 *         input: (value) => value.toLowerCase()
 *       }
 *     },
 *     role: {
 *       name: 'role',
 *       type: 'string',
 *       defaultValue: 'user'
 *     },
 *     createdAt: {
 *       name: 'created_at',
 *       type: 'date',
 *       defaultValue: () => new Date(),
 *       input: false
 *     }
 *   },
 *   action: 'create'
 * };
 *
 * // Process the data
 * const validatedData = parseInputData(inputData, userSchema);
 * // Result: {
 * //   id: 'generated-uuid',
 * //   email: 'user@example.com',
 * //   role: 'user',
 * //   createdAt: Date
 * // }
 * ```
 *
 * @remarks
 * - During 'create' operations, required fields must be present or an error is thrown
 * - Default values are only applied during 'create' operations
 * - Fields marked with `input: false` are excluded unless they have a default value
 * - The function handles both modern transform functions and legacy validators
 */
export function parseInputData<EntityType extends Record<string, unknown>>(
	data: EntityType,
	schema: {
		fields: Record<string, Field>;
		action?: 'create' | 'update';
	}
) {
	const action = schema.action || 'create';
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};
	for (const key in fields) {
		if (Object.hasOwn(fields, key)) {
			if (key in data) {
				if (fields[key]?.input === false) {
					if (fields[key]?.defaultValue) {
						parsedData[key] = fields[key]?.defaultValue;
						continue;
					}
					continue;
				}
				// Check if validator exists and is an object with input property (old style)
				function isLegacyValidator(
					validator: unknown
				): validator is { input?: { parse: (value: unknown) => unknown } } {
					return (
						typeof validator === 'object' &&
						validator !== null &&
						'input' in validator
					);
				}

				if (
					fields[key]?.validator &&
					isLegacyValidator(fields[key]?.validator) &&
					fields[key]?.validator.input &&
					data[key] !== undefined
				) {
					parsedData[key] = fields[key]?.validator.input.parse(data[key]);
					continue;
				}
				if (fields[key]?.transform?.input && data[key] !== undefined) {
					const inputValue = data[key] as
						| string
						| number
						| boolean
						| Date
						| string[]
						| number[];
					parsedData[key] = fields[key]?.transform?.input(inputValue);
					continue;
				}
				parsedData[key] = data[key];
				continue;
			}

			if (fields[key]?.defaultValue && action === 'create') {
				parsedData[key] = fields[key]?.defaultValue;
				continue;
			}

			if (fields[key]?.required && action === 'create') {
				throw new APIError('BAD_REQUEST', {
					message: `${key} is required`,
				});
			}
		}
	}
	return parsedData as Partial<EntityType>;
}
