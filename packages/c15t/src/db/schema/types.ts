// packages/c15t/src/db/schema/types.ts

import type { FieldAttribute, FieldType } from '../core/fields';
import type { InferValueType } from '../core/fields/field-inference';
import type { C15TDBSchema } from './definition';

/**
 * Schema definition for a database table
 */
export interface TableSchema {
	/**
	 * The name of the table in the database
	 */
	modelName: string;
	/**
	 * The fields of the table
	 */
	fields: Record<string, FieldAttribute>;
	/**
	 * Whether to disable migrations for this table
	 * @default false
	 */
	disableMigrations?: boolean;
	/**
	 * The order of the table
	 */
	order?: number;
}

/**
 * Plugin-provided schema type with proper typing
 */
export type PluginSchema = Record<
	string,
	{
		fields: Record<string, FieldAttribute>;
		modelName?: string;
	}
>;

/**
 * Improved type to extract field value types with better inference
 */
export type ExtractFieldType<F extends FieldAttribute> = F extends {
	type: infer T extends FieldType;
}
	? InferValueType<T>
	: never;

/**
 * Creates a model type from field definitions with improved accuracy
 */
export type ModelFromFields<Fields extends Record<string, FieldAttribute>> = {
	[K in keyof Fields]: ExtractFieldType<Fields[K]>;
};

/**
 * Maps schema model names to their TypeScript types
 */
export type ModelTypeMap = {
	[K in keyof C15TDBSchema]: ModelFromFields<C15TDBSchema[K]['fields']>;
};

/**
 * All valid model names
 */
export type ModelName = keyof ModelTypeMap;

/**
 * Get the field type for a specific table and field
 */
export type TableFieldType<
	T extends ModelName,
	F extends keyof ModelTypeMap[T],
> = ModelTypeMap[T][F];

/**
 * All core tables that are guaranteed to exist
 */
export type CoreTableName =
	| 'user'
	| 'consent'
	| 'purpose'
	| 'consentPolicy'
	| 'domain'
	| 'purposeJunction'
	| 'record'
	| 'consentGeoLocation'
	| 'withdrawal'
	| 'auditLog';

/**
 * All plugin tables that may exist
 */
export type PluginTableName = Exclude<ModelName, CoreTableName>;
