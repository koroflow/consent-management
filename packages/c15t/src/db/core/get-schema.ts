import { getConsentTables } from '..';
import type { C15TOptions } from '~/types';
import type { FieldAttribute } from '~/db/core/fields';

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: its okay
export function getSchema(config: C15TOptions) {
	const tables = getConsentTables(config);
	const schema: Record<
		string,
		{
			fields: Record<string, FieldAttribute>;
			order: number;
		}
	> = {};

	for (const [key, table] of Object.entries(tables)) {
		if (!table) {
			continue; // Skip if table is undefined
		}

		const fields = table.fields || {}; // Default to empty object if fields is undefined
		const actualFields: Record<string, FieldAttribute> = {};

		// Process each field
		for (const [fieldKey, field] of Object.entries(fields)) {
			if (!field) {
				continue; // Skip if field is undefined
			}

			const fieldName = field.fieldName || fieldKey;
			actualFields[fieldName] = field;

			// Handle references
			if (field.references) {
				const refTable = tables[field.references.model];
				if (refTable) {
					// Create a new object for references to avoid modifying the original
					actualFields[fieldName] = {
						...field,
						references: {
							model: refTable.modelName,
							field: field.references.field,
							onDelete: field.references.onDelete,
						},
					};
				}
			}
		}

		// Update or create schema entry
		const modelName = table.modelName || key;
		if (schema[modelName]) {
			schema[modelName] = {
				...schema[modelName],
				fields: {
					...schema[modelName].fields,
					...actualFields,
				},
			};
		} else {
			schema[modelName] = {
				fields: actualFields,
				order: table.order || Number.POSITIVE_INFINITY,
			};
		}
	}

	return schema;
}
