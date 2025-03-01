import type {
	FieldType,
	FieldAttribute,
	FieldAttributeConfig,
} from './field-types';
import type { TransformInputFn, TransformOutputFn } from './field-inference';

/**
 * Improved transformation type for better type safety
 */
export type TypedTransform<T extends FieldType> = {
	input?: TransformInputFn<T>;
	output?: TransformOutputFn<T>;
};

/**
 * Config type with type-safe transformation functions
 */
export type TypedFieldConfig<T extends FieldType> = Omit<
	FieldAttributeConfig<T>,
	'transform'
> & {
	transform?: TypedTransform<T>;
};

/**
 * Type for number field specific options
 */
export type NumberFieldOptions = {
	bigint?: boolean;
};

/**
 * Type for string field specific options
 */
export type StringFieldOptions = {
	sortable?: boolean;
};

/**
 * Creates a field attribute configuration with the specified type and options.
 * This is a helper function for creating field definitions with proper typing.
 *
 * @template T - The field type
 * @template C - The configuration options
 * @param type - The data type for this field
 * @param config - Configuration options for this field
 * @returns A complete field attribute definition
 *
 * @example
 * ```typescript
 * const nameField = createFieldAttribute('string', { required: true, unique: true });
 * const ageField = createFieldAttribute('number', { required: false });
 * ```
 */
export const createFieldAttribute = <
	T extends FieldType,
	C extends TypedFieldConfig<T> &
		(T extends 'number' ? NumberFieldOptions : unknown) &
		(T extends 'string' ? StringFieldOptions : unknown),
>(
	type: T,
	config?: C
): FieldAttribute<T> => {
	return {
		type,
		...config,
	} as FieldAttribute<T>;
};

/**
 * Type-safe field creation functions for specific field types
 * These provide better autocompletion and type validation based on field type
 */

export const stringField = <
	C extends TypedFieldConfig<'string'> & StringFieldOptions,
>(
	config?: C
): FieldAttribute<'string'> => createFieldAttribute('string', config);

export const numberField = <
	C extends TypedFieldConfig<'number'> & NumberFieldOptions,
>(
	config?: C
): FieldAttribute<'number'> => createFieldAttribute('number', config);

export const booleanField = <C extends TypedFieldConfig<'boolean'>>(
	config?: C
): FieldAttribute<'boolean'> => createFieldAttribute('boolean', config);

export const dateField = <C extends TypedFieldConfig<'date'>>(
	config?: C
): FieldAttribute<'date'> => createFieldAttribute('date', config);

export const stringArrayField = <C extends TypedFieldConfig<'string[]'>>(
	config?: C
): FieldAttribute<'string[]'> => createFieldAttribute('string[]', config);

export const numberArrayField = <C extends TypedFieldConfig<'number[]'>>(
	config?: C
): FieldAttribute<'number[]'> => createFieldAttribute('number[]', config);
