// Export core types
export type {
	FieldType,
	Field,
	FieldConfig,
	Primitive,
	JsonValue,
} from './field-types';

// Export field options
export type {
	NumberFieldOptions,
	StringFieldOptions,
	JsonFieldOptions,
	TimezoneFieldOptions,
	DateFieldOptions,
} from './field-factory';

// Export factory functions
export {
	createField,
	stringField,
	numberField,
	booleanField,
	dateField,
	jsonField,
	stringArrayField,
	numberArrayField,
	timezoneField,
	COMMON_TIMEZONES,
} from './field-factory';

// Export Zod utilities
export {
	validateField,
	createFieldValueSchema,
} from './zod-fields';

// Export field inference utilities
export type {
	InferFieldOutput,
	InferFieldInput,
	InferFieldsOutput,
	InferFieldsInput,
	TransformOutputFn,
} from './field-inference';

// Export SuperJSON utilities
export {
	getDatabaseType,
	transformForDb,
	parseFromDb,
} from './superjson-utils';

/**
 * Generates a unique ID for database records
 * @param prefix - Optional prefix to add to the ID
 */
export function generateId(prefix?: string): string {
	const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
	return prefix ? `${prefix}_${id}` : id;
}
