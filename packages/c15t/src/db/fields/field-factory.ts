import type {
	FieldType,
	FieldAttribute,
	FieldAttributeConfig,
} from './field-types';

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
	C extends Omit<FieldAttributeConfig<T>, 'type'>,
>(
	type: T,
	config?: C
) => {
	return {
		type,
		...config,
	} satisfies FieldAttribute<T>;
};
