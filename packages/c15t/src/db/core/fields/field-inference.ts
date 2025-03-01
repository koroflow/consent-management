import type { FieldType, FieldAttribute, Primitive } from './field-types';

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
				: T extends `${infer BaseType}[]`
					? BaseType extends 'string'
						? string[]
						: BaseType extends 'number'
							? number[]
							: never
					: T extends (infer ArrayType)[]
						? ArrayType
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
			? InferValueType<T['type']> | null | undefined
			: InferValueType<T['type']>;

/**
 * Infers the input type for a single field.
 * Determines the expected type when creating or updating records.
 *
 * @template T - The field attribute definition
 */
export type InferFieldInput<T extends FieldAttribute> = T['input'] extends false
	? never
	: T['required'] extends true
		? InferValueType<T['type']>
		: InferValueType<T['type']> | null | undefined;

/**
 * Type-safe property mapping helper
 * Maps properties of a field to specific output types
 */
type MapToFieldOutputType<T, K extends keyof T & string> = {
	[P in K]: T[P] extends FieldAttribute ? InferFieldOutput<T[P]> : never;
};

/**
 * Type-safe property mapping helper
 * Maps properties of a field to specific input types
 */
type MapToFieldInputType<T, K extends keyof T & string> = {
	[P in K]: T[P] extends FieldAttribute ? InferFieldInput<T[P]> : never;
};

/**
 * Type helper to extract required keys from fields
 */
type RequiredKeys<T> = {
	[K in keyof T]: T[K] extends FieldAttribute
		? T[K]['required'] extends true
			? T[K]['returned'] extends false
				? never
				: K
			: never
		: never;
}[keyof T];

/**
 * Type helper to extract optional keys from fields
 */
type OptionalKeys<T> = {
	[K in keyof T]: T[K] extends FieldAttribute
		? T[K]['required'] extends true
			? never
			: T[K]['returned'] extends false
				? never
				: K
		: never;
}[keyof T];

/**
 * Type helper to extract input required keys from fields
 */
type RequiredInputKeys<T> = {
	[K in keyof T]: T[K] extends FieldAttribute
		? T[K]['required'] extends true
			? T[K]['input'] extends false
				? never
				: K
			: never
		: never;
}[keyof T];

/**
 * Type helper to extract optional input keys from fields
 */
type OptionalInputKeys<T> = {
	[K in keyof T]: T[K] extends FieldAttribute
		? T[K]['required'] extends true
			? never
			: T[K]['input'] extends false
				? never
				: K
		: never;
}[keyof T];

/**
 * Infers the output type shape for a set of fields.
 * Handles required/optional status and returned fields.
 * Used to determine the shape of data when retrieving records.
 *
 * @template Field - The field definitions to infer from
 */
export type InferFieldsOutput<Field> = Field extends Record<
	string,
	FieldAttribute
>
	? {
			[K in RequiredKeys<Field> & string]: InferFieldOutput<Field[K]>;
		} & {
			[K in OptionalKeys<Field> & string]?: InferFieldOutput<Field[K]>;
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
	string,
	FieldAttribute
>
	? {
			[K in RequiredInputKeys<Field> & string]: InferFieldInput<Field[K]>;
		} & {
			[K in OptionalInputKeys<Field> & string]?: InferFieldInput<Field[K]>;
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
	string,
	FieldAttribute
>
	? {
			[K in RequiredInputKeys<Field> & string]: InferFieldInput<Field[K]>;
		} & {
			[K in OptionalInputKeys<Field> & string]?: InferFieldInput<Field[K]>;
		}
	: Record<string, never>;

/**
 * Type helper for transform function parameters based on field type
 * Ensures transform functions receive the correct type
 */
export type TransformInputFn<T extends FieldType> = (
	value: InferValueType<T>
) => Primitive | Promise<Primitive>;

/**
 * Type helper for transform function output based on field type
 * Ensures transform functions return the correct type
 */
export type TransformOutputFn<T extends FieldType> = (
	value: InferValueType<T>
) => Primitive | Promise<Primitive>;
