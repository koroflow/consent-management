/**
 * The set of field types supported by C15T.
 * Specifies the data types that can be used for database fields.
 *
 * @remarks
 * These types determine how data is stored, validated, and transformed.
 * The system supports both scalar types and array types.
 */
export type FieldType =
	| 'string'
	| 'number'
	| 'boolean'
	| 'date'
	| 'timezone'
	| 'json'
	| 'string[]'
	| 'number[]';

/**
 * Primitive values that fields can contain at runtime.
 * This defines the allowed JavaScript values for database fields.
 *
 * @remarks
 * This includes the JavaScript primitive types that correspond to
 * the database field types, as well as null and undefined.
 */
export type Primitive =
	| string
	| number
	| boolean
	| Date
	| object
	| Record<string, unknown>
	| string[]
	| number[]
	| null
	| undefined;

/**
 * JSON value type that more accurately represents valid JSON data.
 * Includes all possible JSON types according to the JSON specification.
 */
export type JsonValue =
	| string
	| number
	| boolean
	| null
	| { [key: string]: JsonValue }
	| JsonValue[];

/**
 * Configuration options for a database field.
 * Defines the behavior, validation, and transformations for a field.
 *
 * @template TFieldType - The data type of the field
 *
 * @example
 * ```typescript
 * // Basic required string field
 * const basicConfig: FieldConfig<'string'> = {
 *   type: 'string',
 *   required: true
 * };
 *
 * // Optional number field with validation
 * const numberConfig: FieldConfig<'number'> = {
 *   type: 'number',
 *   required: false,
 *   validator: (value) => value >= 0 ? null : 'Must be non-negative'
 * };
 *
 * // Date field with transform and default
 * const dateConfig: FieldConfig<'date'> = {
 *   type: 'date',
 *   defaultValue: () => new Date(),
 *   transform: {
 *     output: (date) => date.toISOString()
 *   }
 * };
 * ```
 *
 * @remarks
 * This is the core configuration object that defines how a field behaves
 * in the database schema. It controls whether the field is required, how
 * it's transformed, validated, and more.
 */
export type FieldConfig<TFieldType extends FieldType = FieldType> = {
	/**
	 * The data type of the field.
	 * Determines how the field is stored and validated.
	 */
	type: TFieldType;

	/**
	 * Whether the field is required for record creation.
	 * If true, the field must be provided when creating a record.
	 * @default true
	 */
	required?: boolean;

	/**
	 * Whether the field should be returned in API responses.
	 * If false, the field will be excluded from query results.
	 * @default true
	 */
	returned?: boolean;

	/**
	 * Whether the field accepts input from API requests.
	 * If false, the field cannot be set directly by clients.
	 * @default true
	 */
	input?: boolean;

	/**
	 * Default value for the field when not provided in create operations.
	 * Can be a static value or a function that returns a value.
	 */
	defaultValue?: Primitive | (() => Primitive);

	/**
	 * Functions to transform the field value during input/output operations.
	 * Can modify values before storage or after retrieval.
	 */
	transform?: {
		/**
		 * Transform function for field input.
		 * Applied when data is being saved to the database.
		 */
		input?: (
			value: InferValueType<TFieldType>
		) => Primitive | Promise<Primitive>;

		/**
		 * Transform function for field output.
		 * Applied when data is being retrieved from the database.
		 */
		output?: (
			value: InferValueType<TFieldType>
		) => Primitive | Promise<Primitive>;
	};

	/**
	 * References configuration for foreign key relationships.
	 * Used to define relations between different entity types.
	 */
	references?: {
		/**
		 * The entity type this field references.
		 */
		entity: string;

		/**
		 * The field on the referenced entity this relates to.
		 * @default 'id'
		 */
		field?: string;

		/**
		 * Whether the reference is required.
		 * If true, the referenced record must exist.
		 * @default true
		 */
		required?: boolean;

		/**
		 * @deprecated Use entity instead
		 * The model to reference (backward compatibility).
		 */
		model?: string;

		/**
		 * @deprecated
		 * The action to perform when the reference is deleted.
		 * Controls referential integrity behavior.
		 *
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
	 * Whether the field value must be unique across all records.
	 * If true, no two records can have the same value for this field.
	 * @default false
	 */
	unique?: boolean;

	/**
	 * For number fields, whether to use bigint storage.
	 * Useful for IDs or very large numbers.
	 * @default false
	 */
	bigint?: boolean;

	/**
	 * Custom validation function for the field.
	 * Returns null if valid, or an error message if invalid.
	 */
	validator?:
		| ((
				value: InferValueType<TFieldType>
		  ) => string | null | Promise<string | null>)
		| {
				/**
				 * @deprecated Use the function form of validator instead
				 * Schema for validating data before it's written to the database.
				 */
				input?: {
					parse: (value: unknown) => unknown;
				};
				/**
				 * @deprecated Use the function form of validator instead
				 * Schema for validating data after it's read from the database.
				 */
				output?: {
					parse: (value: unknown) => unknown;
				};
		  };

	/**
	 * Custom field name to use in the database.
	 * If not provided, the property name in the schema is used.
	 */
	fieldName?: string;

	/**
	 * Whether the field can be sorted in queries.
	 * Some database engines require special handling for sortable fields.
	 * @default true for string fields, false for large text
	 */
	sortable?: boolean;
};

/**
 * Helper type to infer the base JavaScript type from a field type.
 * Internal use only - not exported directly.
 */
type InferBaseType<TFieldType extends FieldType> = TFieldType extends 'string'
	? string
	: TFieldType extends 'number'
		? number
		: TFieldType extends 'boolean'
			? boolean
			: TFieldType extends 'date'
				? Date
				: TFieldType extends 'timezone'
					? string
					: TFieldType extends 'json'
						? JsonValue
						: never;

/**
 * Helper type to infer JavaScript types from field types.
 * Internal use only - not exported directly.
 *
 * @remarks
 * This type handles both scalar types and array types.
 * For arrays, it maps the base type to an array of that type.
 * This approach is more maintainable and future-proof than
 * explicitly handling each array type.
 */
export type InferValueType<TFieldType extends FieldType> =
	TFieldType extends `${infer BaseType}[]`
		? BaseType extends FieldType
			? InferBaseType<BaseType>[]
			: never
		: InferBaseType<TFieldType>;

/**
 * The complete definition of a database field.
 * Combines the field type with its configuration options.
 *
 * @template TFieldType - The data type of the field
 *
 * @example
 * ```typescript
 * // A simple string field
 * const nameField: Field<'string'> = {
 *   type: 'string',
 *   required: true,
 *   unique: true
 * };
 *
 * // A number field with validation
 * const ageField: Field<'number'> = {
 *   type: 'number',
 *   required: true,
 *   validator: (value) => value >= 0 ? null : 'Age must be non-negative'
 * };
 *
 * // A date field with transforms
 * const createdAtField: Field<'date'> = {
 *   type: 'date',
 *   required: true,
 *   input: false,
 *   defaultValue: () => new Date(),
 *   transform: {
 *     output: (date) => date.toISOString()
 *   }
 * };
 * ```
 */
export type Field<TFieldType extends FieldType = FieldType> =
	FieldConfig<TFieldType>;

/**
 * Field definition for use in plugins.
 * A simplified version of Field that excludes advanced features.
 *
 * @remarks
 * This type is used when plugins need to define their own fields
 * but with a restricted set of capabilities for security and consistency.
 * It omits certain advanced features like custom database field names
 * and sortability configuration.
 */
export type PluginField = Omit<Field, 'fieldName' | 'sortable'>;
