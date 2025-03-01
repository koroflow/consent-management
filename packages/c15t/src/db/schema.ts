import type { FieldAttribute } from '~/db/fields';
import type { C15TPluginSchema } from '~/types';
import type { C15TOptions } from '~/types';
import { APIError } from 'better-call';

export function parseOutputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, FieldAttribute>;
	}
) {
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const key in data) {
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
	return parsedData as T;
}

export function getAllFields(options: C15TOptions, table: string) {
	let schema: Record<string, FieldAttribute> = {
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export function parseInputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, FieldAttribute>;
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
			if (fields[key]?.validator?.input && data[key] !== undefined) {
				parsedData[key] = fields[key]?.validator?.input.parse(data[key]);
				continue;
			}
			if (fields[key]?.transform?.input && data[key] !== undefined) {
				const inputValue = data[key] as string | number | boolean | null;
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

export function mergeSchema<S extends C15TPluginSchema>(
	schema: S,
	newSchema?: {
		[K in keyof S]?: {
			modelName?: string;
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
		const newModelName = newSchema[table]?.modelName;
		if (newModelName && schema[table]) {
			schema[table].modelName = newModelName;
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
