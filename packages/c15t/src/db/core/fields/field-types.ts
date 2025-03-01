import type { ZodSchema } from 'zod';
import type { LiteralString } from '~/types';

/**
 * Represents the possible data types for database fields.
 * These types determine how the data is stored and validated.
 */
export type FieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| `${'string' | 'number'}[]`
	| LiteralString[];

/**
 * Represents JavaScript primitive types that can be stored in database fields.
 * This includes basic types and their array variants.
 */
export type Primitive =
	| string
	| number
	| boolean
	| Date
	| null
	| undefined
	| string[]
	| number[];

/**
 * Configuration options for a field attribute.
 * Defines behavior, constraints, and metadata for a database field.
 *
 * @template T - The specific field type this configuration applies to
 */
export type FieldAttributeConfig<T extends FieldType = FieldType> = {
	/**
	 * If the field should be required on a new record.
	 * @default false
	 */
	required?: boolean;
	/**
	 * If the value should be returned on a response body.
	 * @default true
	 */
	returned?: boolean;
	/**
	 * If a value should be provided when creating a new record.
	 * @default true
	 */
	input?: boolean;
	/**
	 * Default value for the field
	 *
	 * Note: This will not create a default value on the database level. It will only
	 * be used when creating a new record.
	 */
	defaultValue?: Primitive | (() => Primitive);
	/**
	 * transform the value before storing it.
	 */
	transform?: {
		/**
		 * Transforms the value before storing it in the database.
		 * @param value - The input value to transform
		 * @returns The transformed value
		 */
		input?: (value: Primitive) => Primitive | Promise<Primitive>;
		/**
		 * Transforms the value before returning it to the client.
		 * @param value - The database value to transform
		 * @returns The transformed value
		 */
		output?: (value: Primitive) => Primitive | Promise<Primitive>;
	};
	/**
	 * Reference to another model.
	 * Defines a foreign key relationship.
	 */
	references?: {
		/**
		 * The model to reference.
		 */
		model: string;
		/**
		 * The field on the referenced model.
		 */
		field: string;
		/**
		 * The action to perform when the reference is deleted.
		 * @default "cascade"
		 */
		onDelete?:
			| 'no action'
			| 'restrict'
			| 'cascade'
			| 'set null'
			| 'set default';
	};
	/**
	 * If true, creates a unique constraint on this field.
	 * Ensures all values in this column are unique across the table.
	 */
	unique?: boolean;
	/**
	 * If the field should be a bigint on the database instead of integer.
	 * Only applicable for number type fields.
	 */
	bigint?: boolean;
	/**
	 * A zod schema to validate the value.
	 * Provides additional validation beyond basic type checking.
	 */
	validator?: {
		/**
		 * Schema for validating data before it's written to the database
		 */
		input?: ZodSchema;
		/**
		 * Schema for validating data after it's read from the database
		 */
		output?: ZodSchema;
	};
	/**
	 * The name of the field on the database.
	 * Allows for a different field name in the database than in the model.
	 */
	fieldName?: string;
	/**
	 * If the field should be sortable.
	 *
	 * applicable only for `text` type.
	 * It's useful to mark fields varchar instead of text.
	 */
	sortable?: boolean;
};

/**
 * Complete definition of a field attribute, combining its type and configuration.
 * This is the primary type used to define fields in a model schema.
 *
 * @template T - The field type
 */
export type FieldAttribute<T extends FieldType = FieldType> = {
	/**
	 * The data type of this field
	 */
	type: T;
} & FieldAttributeConfig<T>;

/**
 * A simplified version of FieldAttribute used by plugins.
 * Excludes specific transformation and default value features.
 */
export type PluginFieldAttribute = Omit<
	FieldAttribute,
	'transform' | 'defaultValue' | 'hashValue'
>;
