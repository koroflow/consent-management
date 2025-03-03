import type { Field } from '~/db/core/fields';

/**
 * Represents a complete table definition within the schema
 *
 * @property fields - Map of field names to their attribute definitions
 * @property order - Priority order for table creation (lower numbers are created first)
 */
export interface TableSchemaDefinition {
	fields: Record<string, Field>;
	order: number;
}

/**
 * Represents the complete database schema
 * Maps table names to their definitions
 */
export type SchemaDefinition = Record<string, TableSchemaDefinition>;

/**
 * Internal type used during schema processing
 * Represents a table with its fields and metadata
 */
export interface TableDefinition {
	EntityName?: string;
	fields?: Record<string, Field>;
	order?: number;
}
