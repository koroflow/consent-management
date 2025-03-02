// Export types directly from their source files
export type {
	Field,
	FieldConfig,
	FieldType,
	PluginField,
	Primitive,
} from './field-types';

export type {
	InferValueType,
	InferFieldOutput,
	InferFieldInput,
	InferFieldsOutput,
	InferFieldsInput,
	InferFieldsInputClient,
	TransformInputFn,
	TransformOutputFn,
} from './field-inference';

export type { NumberFieldOptions, StringFieldOptions } from './field-factory';

export type {
	InferFieldsFromPlugins,
	InferFieldsFromOptions,
} from './field-options-integration';

// Export factory functions directly
export {
	createField,
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
} from './field-factory';
