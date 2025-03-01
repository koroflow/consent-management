// Main re-exports for field-related types and functions
import type {
	FieldType,
	Primitive,
	FieldConfig as FieldConfigNew,
	Field as FieldNew,
	PluginField as PluginFieldNew,
} from './field-types';

import type {
	InferValueType,
	InferFieldOutput,
	InferFieldInput,
	InferFieldsOutput,
	InferFieldsInput,
	InferFieldsInputClient,
	TransformInputFn,
	TransformOutputFn,
} from './field-inference';

import type {
	FieldTransformers as FieldTransformersNew,
	TypedFieldOptions as TypedFieldOptionsNew,
	NumberFieldOptions,
	StringFieldOptions,
} from './field-factory';

import {
	createField as createFieldNew,
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
} from './field-factory';

import type {
	InferFieldsFromPlugins,
	InferFieldsFromOptions,
} from './field-options-integration';

// For backwards compatibility, provide aliases to previous names
/**
 * @deprecated Use FieldConfig instead
 */
export type FieldAttributeConfig<T extends FieldType = FieldType> =
	FieldConfigNew<T>;

/**
 * @deprecated Use Field instead
 */
export type FieldAttribute<T extends FieldType = FieldType> = FieldNew<T>;

/**
 * @deprecated Use PluginField instead
 */
export type PluginFieldAttribute = PluginFieldNew;

/**
 * @deprecated Use createField instead
 */
export const createFieldAttribute = createFieldNew;

/**
 * @deprecated Use FieldTransformers instead
 */
export type TypedTransform<T extends FieldType> = FieldTransformersNew<T>;

/**
 * @deprecated Use TypedFieldOptions instead
 */
export type TypedFieldConfig<T extends FieldType> = TypedFieldOptionsNew<T>;

// Re-export with new names
export type {
	FieldType,
	Primitive,
	FieldConfigNew as FieldConfig,
	FieldNew as Field,
	PluginFieldNew as PluginField,
	// Field inference types
	InferValueType,
	InferFieldOutput,
	InferFieldInput,
	InferFieldsOutput,
	InferFieldsInput,
	InferFieldsInputClient,
	TransformInputFn,
	TransformOutputFn,
	// Factory types
	FieldTransformersNew as FieldTransformers,
	TypedFieldOptionsNew as TypedFieldOptions,
	NumberFieldOptions,
	StringFieldOptions,
	// Options integration types
	InferFieldsFromPlugins,
	InferFieldsFromOptions,
};

// Export the factory functions
export {
	createFieldNew as createField,
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
};
