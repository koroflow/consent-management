import type { FieldAttribute } from '~/db/core/fields';
import type { C15TDBSchema } from '~/db/schema/definition';
import type { ModelName } from '~/db/core/types';

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
export function processFields<T extends ModelName>(
	fields: C15TDBSchema[T]['fields'],
	tables: C15TDBSchema
) {
	const actualFields: Record<string, FieldAttribute> = {};

	// Process each field in the fields collection
	for (const [fieldKey, field] of Object.entries(fields)) {
		// Skip undefined fields
		if (!field) {
			continue;
		}

		// Use the specified fieldName or the key if fieldName is not provided
		const fieldName = field.fieldName || fieldKey;

		// Cast field to FieldAttribute to ensure it has the right type
		const typedField = field as unknown as FieldAttribute;
		actualFields[fieldName] = typedField;

		// Handle references to other tables - first check if the field has a references property
		if (typedField && 'references' in typedField && typedField.references) {
			const modelName = typedField.references.model as ModelName;
			const refTable = tables[modelName];

			// Only set up the reference if the referenced table exists
			if (refTable) {
				// Create a new object for references to avoid modifying the original
				actualFields[fieldName] = {
					...typedField,
					references: {
						model: refTable.modelName || typedField.references.model,
						field: typedField.references.field,
						onDelete: typedField.references.onDelete,
					},
				};
			}
		}
	}

	return actualFields;
}
