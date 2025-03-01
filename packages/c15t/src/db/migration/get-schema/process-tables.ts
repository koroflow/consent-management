import type { SchemaDefinition } from './types';
import { processFields } from './process-fields';
import type { C15TDBSchema } from '../../schema/definition';

/**
 * Processes table definitions into a structured schema
 *
 * This function transforms the raw table definitions into a formal schema structure,
 * handling field processing, references, and merging of table definitions.
 *
 * @param tables - Raw table definitions from the consent module
 * @returns A structured schema definition
 */
export function processTablesIntoSchema(
	tables: C15TDBSchema
): SchemaDefinition {
	const schema: SchemaDefinition = {};

	// Process each table in the tables collection
	for (const [key, table] of Object.entries(tables)) {
		// Skip undefined tables
		if (!table) {
			continue;
		}

		// Process the fields for this table
		const actualFields = processFields(table.fields || {}, tables);

		// Determine the model name (use the key if EntityName is not specified)
		const EntityName = table.entityName || key;

		// Update existing schema entry or create a new one
		if (schema[EntityName]) {
			// Merge with existing schema entry if one exists
			schema[EntityName] = {
				...schema[EntityName],
				fields: {
					...schema[EntityName].fields,
					...actualFields,
				},
			};
		} else {
			// Create a new schema entry
			schema[EntityName] = {
				fields: actualFields,
				order: table.order || Number.POSITIVE_INFINITY, // Default to lowest priority
			};
		}
	}

	return schema;
}
