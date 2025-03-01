import type { FieldType, FieldAttribute } from './field-types';

/**
 * Infers the JavaScript type from a field type.
 * Maps database field types to their corresponding TypeScript types.
 *
 * @template T - The field type to infer from
 */
export type InferValueType<T extends FieldType> = T extends 'string'
	? string
	: T extends 'number'
		? number
		: T extends 'boolean'
			? boolean
			: T extends 'date'
				? Date
				: T extends `${infer T}[]`
					? T extends 'string'
						? string[]
						: number[]
					: T extends unknown[]
						? T[number]
						: never;

/**
 * Infers the output type for a single field.
 * Takes into account whether the field is required and returned.
 *
 * @template T - The field attribute definition
 */
export type InferFieldOutput<T extends FieldAttribute> =
	T['returned'] extends false
		? never
		: T['required'] extends false
			? InferValueType<T['type']> | undefined | null
			: InferValueType<T['type']>;

/**
 * Infers the input type for a single field.
 * Determines the expected type when creating or updating records.
 *
 * @template T - The field attribute definition
 */
export type InferFieldInput<T extends FieldAttribute> = InferValueType<
	T['type']
>;

/**
 * Infers the output type shape for a set of fields.
 * Handles required/optional status and returned fields.
 * Used to determine the shape of data when retrieving records.
 *
 * @template Field - The field definitions to infer from
 */
export type InferFieldsOutput<Field> = Field extends Record<
	infer Key,
	FieldAttribute
>
	? {
			// Complex type mapping...
		}
	: Record<string, never>;

/**
 * Infers the input type shape for a set of fields.
 * Handles required/optional status and input fields.
 * Used to determine the shape of data expected when creating records.
 *
 * @template Field - The field definitions to infer from
 */
export type InferFieldsInput<Field> = Field extends Record<
	infer Key,
	FieldAttribute
>
	? {
			// Complex type mapping...
		}
	: Record<string, never>;

/**
 * Infers the client-side input type shape for a set of fields.
 * Similar to InferFieldsInput but with different handling of optional fields,
 * making it more suitable for client-side form validation and submission.
 *
 * @template Field - The field definitions to infer from
 */
export type InferFieldsInputClient<Field> = Field extends Record<
	infer Key,
	FieldAttribute
>
	? {
			// Complex type mapping...
		}
	: Record<string, never>;
