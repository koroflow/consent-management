import type { FieldAttribute } from '~/db/fields';
import type { TableDefinition } from './types';

/**
 * Processes field definitions for a table
 *
 * This function handles field attributes, field name mappings, and references
 * to other tables. It ensures that all fields are properly configured and
 * references are correctly set up.
 *
 * @param fields - Raw field definitions from the table
 * @param tables - All available tables for resolving references
 * @returns Processed field definitions
 */
export function processFields(
	fields: Record<string, FieldAttribute | undefined>,
	tables: Record<string, TableDefinition | undefined>
): Record<string, FieldAttribute> {
	const actualFields: Record<string, FieldAttribute> = {};

	// Process each field in the fields collection
	for (const [fieldKey, field] of Object.entries(fields)) {
		// Skip undefined fields
		if (!field) {
			continue;
		}

		// Use the specified fieldName or the key if fieldName is not provided
		const fieldName = field.fieldName || fieldKey;
		actualFields[fieldName] = field;

		// Handle references to other tables
		if (field.references) {
			const refTable = tables[field.references.model];

			// Only set up the reference if the referenced table exists
			if (refTable) {
				// Create a new object for references to avoid modifying the original
				actualFields[fieldName] = {
					...field,
					references: {
						model: refTable.modelName || field.references.model,
						field: field.references.field,
						onDelete: field.references.onDelete,
					},
				};
			}
		}
	}

	return actualFields;
}
