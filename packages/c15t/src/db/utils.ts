import { getConsentTables } from '.';
import type { FieldAttribute } from '~/db/fields';
import { C15TError } from '~/error';
import type { Adapter, C15TOptions } from '~/types';
import { createKyselyAdapter } from './adapters/kysely-adapter/dialect';
import { kyselyAdapter } from './adapters/kysely-adapter';
import { memoryAdapter } from './adapters/memory-adapter';
import { logger } from '../utils';

export async function getAdapter(options: C15TOptions): Promise<Adapter> {
	if (!options.database) {
		const tables = getConsentTables(options);
		const memoryDB = Object.keys(tables).reduce((acc, key) => {
			// @ts-ignore
			acc[key] = [];
			return acc;
		}, {});
		logger.warn(
			'No database configuration provided. Using memory adapter in development'
		);
		return memoryAdapter(memoryDB)(options);
	}

	if (typeof options.database === 'function') {
		return options.database(options);
	}

	const { kysely, databaseType } = await createKyselyAdapter(options);
	if (!kysely) {
		throw new C15TError('Failed to initialize database adapter');
	}
	return kyselyAdapter(kysely, {
		type: databaseType || 'sqlite',
	})(options);
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function convertToDB<T extends Record<string, any>>(
	fields: Record<string, FieldAttribute>,
	values: T
) {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const result: Record<string, any> = values.id
		? {
				id: values.id,
			}
		: {};
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const key in fields) {
		const field = fields[key];
		const value = values[key];
		if (value === undefined) {
			continue;
		}
		result[field?.fieldName || key] = value;
	}
	return result as T;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function convertFromDB<T extends Record<string, any>>(
	fields: Record<string, FieldAttribute>,
	values: T | null
) {
	if (!values) {
		return null;
	}
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const result: Record<string, any> = {
		id: values.id,
	};
	for (const [key, value] of Object.entries(fields)) {
		result[key] = values[value.fieldName || key];
	}
	return result as T;
}
