import type { FieldAttribute } from '~/db/fields';

/**
 * Converts application data to database format
 *
 * This function transforms data from the application's field structure
 * to the database's expected field names, handling field name mapping.
 *
 * @param fields - Field attribute definitions that define the data structure
 * @param values - The application data to be converted to database format
 * @returns The data in database-compatible format
 *
 * @example
 * ```typescript
 * const dbData = convertToDB(userFields, {
 *   firstName: 'Alice',
 *   lastName: 'Smith'
 * });
 * // If lastName has fieldName: 'last_name', result will be:
 * // { firstName: 'Alice', last_name: 'Smith' }
 * ```
 */
export function convertToDB<T extends Record<string, unknown>>(
	fields: Record<string, FieldAttribute>,
	values: T
): T {
	// Initialize with ID if present
	const result: Record<string, unknown> = values.id ? { id: values.id } : {};

	// Process each field using fieldName mapping
	for (const key of Object.keys(fields)) {
		const field = fields[key];
		const value = values[key];

		// Skip undefined values
		if (value === undefined) {
			continue;
		}

		// Use fieldName if specified, otherwise use the original key
		result[field?.fieldName || key] = value;
	}

	return result as T;
}

/**
 * Converts database data to application format
 *
 * This function transforms data from the database's field structure
 * to the application's expected field names, reversing field name mapping.
 *
 * @param fields - Field attribute definitions that define the data structure
 * @param values - The database data to be converted to application format, or null
 * @returns The data in application-compatible format, or null if input was null
 *
 * @example
 * ```typescript
 * const appData = convertFromDB(userFields, {
 *   id: '123',
 *   first_name: 'Alice',
 *   last_name: 'Smith'
 * });
 * // If lastName has fieldName: 'last_name', result will be:
 * // { id: '123', firstName: 'Alice', lastName: 'Smith' }
 * ```
 */
export function convertFromDB<T extends Record<string, unknown>>(
	fields: Record<string, FieldAttribute>,
	values: T | null
): T | null {
	// Handle null input
	if (!values) {
		return null;
	}

	// Initialize with ID
	const result: Record<string, unknown> = {
		id: values.id,
	};

	// Process each field using fieldName mapping (in reverse)
	for (const [key, field] of Object.entries(fields)) {
		// Get the database field name (or use the original key if no fieldName specified)
		const dbFieldName = field.fieldName || key;
		// Map the database value to the application field name
		result[key] = values[dbFieldName];
	}

	return result as T;
}
