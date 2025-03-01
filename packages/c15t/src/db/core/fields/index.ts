// Main re-exports for field-related types and functions
import type {
	Field,
	FieldConfig,
	FieldType,
	PluginField,
	Primitive,
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

import type { NumberFieldOptions, StringFieldOptions } from './field-factory';

import {
	createField,
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

// Re-export with new names
export type {
	FieldType,
	Primitive,
	FieldConfig,
	Field,
	PluginField,
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

	NumberFieldOptions,
	StringFieldOptions,
	// Options integration types
	InferFieldsFromPlugins,
	InferFieldsFromOptions,
};

// Export the factory functions
export {
	createField,
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
};
