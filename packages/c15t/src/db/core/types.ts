import type { C15TDBSchema } from '../schema/definition';
import type { FieldAttribute } from './fields';

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

export type ModelTypeMap = {
	[K in keyof C15TDBSchema]: C15TDBSchema[K];
};

/**
 * All valid model names
 */
export type ModelName = keyof C15TDBSchema;

/**
 * Input type for table operations, allowing partial fields and additional properties
 */
export type TableInput<T extends ModelName> = Partial<ModelTypeMap[T]> &
	Record<string, unknown>;

/**
 * Output type for table operations returned from the database
 */
export type TableOutput<T extends ModelName> = ModelTypeMap[T] &
	Record<string, unknown>;

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
