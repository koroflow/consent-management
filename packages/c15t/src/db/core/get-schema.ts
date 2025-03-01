import { getConsentTables } from '..';
import type { C15TOptions } from '~/types';
import type { Field } from '~/db/core/fields';
import type { ModelName } from '~/db/core/types';

interface SchemaEntry {
	fields: Record<string, Field>;
	order: number;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: its okay
export function getSchema(config: C15TOptions) {
	const tables = getConsentTables(config);
	const schema: Record<string, SchemaEntry> = {};

	for (const [key, table] of Object.entries(tables)) {
		if (!table) {
			continue; // Skip if table is undefined
		}

		const fields = table.fields || {}; // Default to empty object if fields is undefined
		const actualFields: Record<string, Field> = {};

		// Process each field
		for (const [fieldKey, field] of Object.entries(fields)) {
			if (!field) {
				continue; // Skip if field is undefined
			}

			const fieldName = field.fieldName || fieldKey;
			// Cast field to Field to ensure it has the right type
			const typedField = field as unknown as Field;
			actualFields[fieldName] = typedField;

			// Handle references - first check if the field has a references property
			if (typedField && 'references' in typedField && typedField.references) {
				const modelName = typedField.references.model as ModelName;
				const refTable = tables[modelName];
				if (refTable) {
					// Create a new object for references to avoid modifying the original
					actualFields[fieldName] = {
						...typedField,
						references: {
							model: refTable.modelName,
							entity: refTable.modelName,
							field: typedField.references.field,
							onDelete: typedField.references.onDelete,
						},
					};
				}
			}
		}

		// Update or create schema entry
		const modelName = table.modelName || key;
		if (modelName in schema) {
			const existingEntry = schema[modelName];
			//@ts-expect-error
			schema[modelName] = {
				...existingEntry,
				fields: {
					//@ts-expect-error
					...existingEntry.fields,
					...actualFields,
				},
			};
		} else {
			schema[modelName] = {
				fields: actualFields,
				order: table.order ?? Number.POSITIVE_INFINITY,
			};
		}
	}

	return schema;
}
