import type { Field } from '../core/fields';
import type { C15TOptions, C15TPluginSchema } from '~/types';
import { APIError } from 'better-call';

/**
 * Parses and transforms output data according to schema field definitions
 */
export function parseOutputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, Field>;
	}
) {
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};

	for (const key in data) {
		if (Object.hasOwn(data, key)) {
			const field = fields[key];
			if (!field) {
				parsedData[key] = data[key];
				continue;
			}
			if (field.returned === false) {
				continue;
			}
			parsedData[key] = data[key];
		}
	}
	return parsedData as T;
}

/**
 * Gets all fields for a table, including any from plugins and options
 */
export function getAllFields(options: C15TOptions, table: string) {
	let schema: Record<string, Field> = {
		...(table === 'user' && options.user?.additionalFields
			? options.user.additionalFields
			: {}),
		...(table === 'consent' && options.consent?.additionalFields
			? options.consent.additionalFields
			: {}),
	};
	for (const plugin of options.plugins || []) {
		const pluginSchema = plugin.schema as C15TPluginSchema | undefined;
		if (pluginSchema?.[table]) {
			schema = {
				...schema,
				...pluginSchema[table].fields,
			};
		}
	}
	return schema;
}

/**
 * Parses and validates input data according to schema field definitions
 */
export function parseInputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, Field>;
		action?: 'create' | 'update';
	}
) {
	const action = schema.action || 'create';
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const key in fields) {
		if (key in data) {
			if (fields[key]?.input === false) {
				if (fields[key]?.defaultValue) {
					parsedData[key] = fields[key]?.defaultValue;
					continue;
				}
				continue;
			}
			// Check if validator exists and is an object with input property (old style)
			function isLegacyValidator(
				validator: unknown
			): validator is { input?: { parse: (value: unknown) => unknown } } {
				return (
					typeof validator === 'object' &&
					validator !== null &&
					'input' in validator
				);
			}

			if (
				fields[key]?.validator &&
				isLegacyValidator(fields[key]?.validator) &&
				fields[key]?.validator.input &&
				data[key] !== undefined
			) {
				parsedData[key] = fields[key]?.validator.input.parse(data[key]);
				continue;
			}
			if (fields[key]?.transform?.input && data[key] !== undefined) {
				const inputValue = data[key] as
					| string
					| number
					| boolean
					| Date
					| string[]
					| number[];
				parsedData[key] = fields[key]?.transform?.input(inputValue);
				continue;
			}
			parsedData[key] = data[key];
			continue;
		}

		if (fields[key]?.defaultValue && action === 'create') {
			parsedData[key] = fields[key]?.defaultValue;
			continue;
		}

		if (fields[key]?.required && action === 'create') {
			throw new APIError('BAD_REQUEST', {
				message: `${key} is required`,
			});
		}
	}
	return parsedData as Partial<T>;
}

/**
 * Merges additional schema information with an existing schema
 */
export function mergeSchema<S extends C15TPluginSchema>(
	schema: S,
	newSchema?: {
		[K in keyof S]?: {
			entityName?: string;
			fields?: {
				[P: string]: string;
			};
		};
	}
) {
	if (!newSchema) {
		return schema;
	}
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const table in newSchema) {
		const newEntityName = newSchema[table]?.entityName;
		if (newEntityName && schema[table]) {
			schema[table].entityName = newEntityName;
		}
		// biome-ignore lint/nursery/useGuardForIn: <explanation>
		for (const field in schema[table]?.fields || {}) {
			const newField = newSchema[table]?.fields?.[field];
			if (!newField) {
				continue;
			}
			if (schema[table]?.fields) {
				const fields = schema[table].fields;
				if (fields?.[field]) {
					fields[field].fieldName = newField;
				}
			}
		}
	}
	return schema;
}
