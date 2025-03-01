import type { FieldType, Field, FieldConfig, Primitive } from './field-types';
import type { InferValueType } from './field-inference';

/**
 * Defines transform functions for field input and output operations.
 * Provides properly typed transform functions based on the field type.
 *
 * @template TFieldType - The field type that determines the transform function signatures
 *
 * @example
 * ```typescript
 * // Define transform functions for a string field
 * const nameTransformers: FieldTransformers<'string'> = {
 *   input: (value) => value.trim(),
 *   output: (value) => value.toUpperCase()
 * };
 * ```
 */
export type FieldTransformers<TFieldType extends FieldType> = {
	/**
	 * Transform function for field input.
	 * Applied when data is being saved to the database.
	 */
	input?: (value: InferValueType<TFieldType>) => Primitive | Promise<Primitive>;
	/**
	 * Transform function for field output.
	 * Applied when data is being retrieved from the database.
	 */
	output?: (
		value: InferValueType<TFieldType>
	) => Primitive | Promise<Primitive>;
};

/**
 * Extends the base field configuration with type-aware transform objects.
 *
 * @template TFieldType - The field type that determines the configuration
 *
 * @example
 * ```typescript
 * // Configuration for a string field with transforms
 * const emailConfig: TypedFieldOptions<'string'> = {
 *   required: true,
 *   transform: {
 *     input: (value) => value.toLowerCase().trim(),
 *     output: (value) => value
 *   },
 *   validator: (value) => value.includes('@') ? null : 'Invalid email'
 * };
 * ```
 */
export type TypedFieldOptions<TFieldType extends FieldType> = Omit<
	FieldConfig<TFieldType>,
	'transform'
> & {
	transform?: FieldTransformers<TFieldType>;
};

/**
 * Configuration options specific to number fields.
 * Provides additional validation options for number fields.
 *
 * @example
 * ```typescript
 * // Define a number field with min/max constraints
 * const ageField = numberField({
 *   required: true,
 *   min: 0,
 *   max: 120
 * });
 * ```
 */
export type NumberFieldOptions = {
	/**
	 * Minimum allowed value for the number field.
	 */
	min?: number;
	/**
	 * Maximum allowed value for the number field.
	 */
	max?: number;
};

/**
 * Configuration options specific to string fields.
 * Provides additional validation options for string fields.
 *
 * @example
 * ```typescript
 * // Define a string field with length constraints
 * const usernameField = stringField({
 *   required: true,
 *   minLength: 3,
 *   maxLength: 20
 * });
 * ```
 */
export type StringFieldOptions = {
	/**
	 * Minimum allowed length for the string field.
	 */
	minLength?: number;
	/**
	 * Maximum allowed length for the string field.
	 */
	maxLength?: number;
	/**
	 * Regular expression pattern that the string must match.
	 */
	pattern?: string;
};

/**
 * Creates a field attribute with the specified configuration.
 * This is the core function for defining schema fields with type safety.
 *
 * @template TFieldType - The field type to create
 * @template TConfig - The configuration type for the field
 *
 * @param type - The field type to create
 * @param config - Configuration options for the field
 * @returns A fully configured field definition
 *
 * @example
 * ```typescript
 * // Create a basic string field
 * const nameField = createField('string', {
 *   required: true
 * });
 *
 * // Create a number field with transforms
 * const ageField = createField('number', {
 *   required: false,
 *   transform: {
 *     input: (value) => Math.floor(value)
 *   }
 * });
 * ```
 */
export function createField<
	TFieldType extends FieldType,
	TConfig extends TypedFieldOptions<TFieldType> & Record<string, any>,
>(type: TFieldType, config: TConfig = {} as TConfig): Field<TFieldType> {
	const { transform, ...rest } = config;

	return {
		type,
		required: true,
		returned: true,
		input: true,
		bigint: false,
		sortable: true,
		...rest,
		...(transform
			? {
					transform: {
						...transform,
					},
				}
			: {}),
	};
}

/**
 * Creates a string field with the specified configuration.
 * Convenience wrapper around createField with string type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field including string-specific options
 * @returns A fully configured string field definition
 *
 * @example
 * ```typescript
 * // Create a required string field
 * const nameField = stringField({ required: true });
 *
 * // Create a string field with validation
 * const emailField = stringField({
 *   required: true,
 *   pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
 *   transform: {
 *     input: (value) => value.toLowerCase().trim()
 *   },
 *   validator: (value) => value.includes('@') ? null : 'Invalid email'
 * });
 * ```
 */
export function stringField<
	TConfig extends TypedFieldOptions<'string'> & StringFieldOptions,
>(config: TConfig = {} as TConfig): Field<'string'> {
	return createField('string', config);
}

/**
 * Creates a number field with the specified configuration.
 * Convenience wrapper around createField with number type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field including number-specific options
 * @returns A fully configured number field definition
 *
 * @example
 * ```typescript
 * // Create a required number field
 * const scoreField = numberField({ required: true });
 *
 * // Create a number field with validation
 * const ageField = numberField({
 *   required: true,
 *   min: 0,
 *   max: 120,
 *   validator: (value) => value >= 18 ? null : 'Must be at least 18'
 * });
 * ```
 */
export function numberField<
	TConfig extends TypedFieldOptions<'number'> & NumberFieldOptions,
>(config: TConfig = {} as TConfig): Field<'number'> {
	return createField('number', config);
}

/**
 * Creates a boolean field with the specified configuration.
 * Convenience wrapper around createField with boolean type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured boolean field definition
 *
 * @example
 * ```typescript
 * // Create a required boolean field
 * const isActiveField = booleanField({ required: true });
 *
 * // Create a boolean field with default value
 * const isVerifiedField = booleanField({
 *   required: true,
 *   defaultValue: false
 * });
 * ```
 */
export function booleanField<TConfig extends TypedFieldOptions<'boolean'>>(
	config: TConfig = {} as TConfig
): Field<'boolean'> {
	return createField('boolean', config);
}

/**
 * Creates a date field with the specified configuration.
 * Convenience wrapper around createField with date type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured date field definition
 *
 * @example
 * ```typescript
 * // Create a required date field
 * const createdAtField = dateField({ required: true });
 *
 * // Create a date field with transform and default value
 * const lastLoginField = dateField({
 *   required: false,
 *   defaultValue: () => new Date(),
 *   transform: {
 *     output: (value) => value.toISOString()
 *   }
 * });
 * ```
 */
export function dateField<TConfig extends TypedFieldOptions<'date'>>(
	config: TConfig = {} as TConfig
): Field<'date'> {
	return createField('date', config);
}

/**
 * Creates a string array field with the specified configuration.
 * Convenience wrapper around createField with string[] type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured string array field definition
 *
 * @example
 * ```typescript
 * // Create a required string array field
 * const tagsField = stringArrayField({ required: true });
 *
 * // Create a string array field with default value
 * const categoriesField = stringArrayField({
 *   required: true,
 *   defaultValue: ['general']
 * });
 * ```
 */
export function stringArrayField<TConfig extends TypedFieldOptions<'string[]'>>(
	config: TConfig = {} as TConfig
): Field<'string[]'> {
	return createField('string[]', config);
}

/**
 * Creates a number array field with the specified configuration.
 * Convenience wrapper around createField with number[] type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured number array field definition
 *
 * @example
 * ```typescript
 * // Create a required number array field
 * const scoresField = numberArrayField({ required: true });
 *
 * // Create a number array field with default value
 * const ratingsField = numberArrayField({
 *   required: true,
 *   defaultValue: [0, 0, 0]
 * });
 * ```
 */
export function numberArrayField<TConfig extends TypedFieldOptions<'number[]'>>(
	config: TConfig = {} as TConfig
): Field<'number[]'> {
	return createField('number[]', config);
}
