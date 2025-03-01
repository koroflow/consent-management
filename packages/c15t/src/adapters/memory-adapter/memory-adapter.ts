import { getConsentTables } from '../../db';
import type { Adapter, C15TOptions, Where } from '~/types';
import type {
	EntityName,
	EntityTypeMap,
	EntityInput,
	EntityOutput,
} from '~/db/core/types';
import type { TableFields } from '~/db/schema/definition';
import type { Field, Primitive } from '~/db/core/fields';
import { generateId } from '~/utils';
import { applyDefaultValue } from '../utils';

export interface MemoryDB {
	[key: string]: Record<string, unknown>[];
}

// Define a type for Where conditions similar to the Kysely adapter
interface WhereCondition<T extends EntityName> {
	field: keyof EntityTypeMap[T] | 'id';
	value: unknown;
	operator?:
		| 'in'
		| 'eq'
		| 'ne'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| '=';
	connector?: 'AND' | 'OR';
}

const createTransform = (options: C15TOptions) => {
	const schema = getConsentTables(options);

	function getField<T extends EntityName>(
		model: T,
		field: keyof EntityTypeMap[T] | string
	): string {
		if (field === 'id') {
			return field;
		}
		const modelFields = schema[model]?.fields;
		const f = modelFields
			? (modelFields as Record<string, Field>)[field as string]
			: undefined;
		return f?.fieldName || (field as string);
	}

	return {
		transformInput<T extends EntityName>(
			data: EntityInput<T>,
			model: T,
			action: 'update' | 'create'
		): Record<string, unknown> {
			const transformedData: Record<string, unknown> =
				action === 'update'
					? {}
					: {
							id: options.advanced?.generateId
								? options.advanced.generateId({
										model,
									})
								: data.id || generateId(),
						};

			const fields = schema[model].fields;
			for (const field in fields) {
				if (Object.prototype.hasOwnProperty.call(fields, field)) {
					const value = data[field as keyof typeof data];
					const fieldInfo = (fields as Record<string, Field>)[field];
					if (value === undefined && !fieldInfo?.defaultValue) {
						continue;
					}
					const fieldName = fieldInfo?.fieldName || field;
					transformedData[fieldName] = applyDefaultValue(
						value as Primitive,
						fieldInfo as Field,
						action
					);
				}
			}
			return transformedData;
		},

		transformOutput<T extends EntityName>(
			data: Record<string, unknown> | null,
			model: T,
			select: string[] = []
		): EntityOutput<T> | null {
			if (!data) return null;
			const transformedData: Record<string, unknown> =
				data.id || data._id
					? select.length === 0 || select.includes('id')
						? {
								id: data.id,
							}
						: {}
					: {};
			const tableSchema = schema[model].fields;
			for (const key in tableSchema) {
				if (select.length && !select.includes(key)) {
					continue;
				}
				const field = (tableSchema as Record<string, Field>)[key];
				if (field) {
					transformedData[key] = data[field.fieldName || key];
				}
			}
			return transformedData as EntityOutput<T>;
		},

		convertWhereClause<T extends EntityName>(
			where: WhereCondition<T>[],
			table: Record<string, unknown>[],
			model: T
		): Record<string, unknown>[] {
			return table.filter((record) => {
				return where.every((clause) => {
					const { field: _field, value, operator = '=' } = clause;
					const field = getField(model, _field);

					if (operator === 'in') {
						if (!Array.isArray(value)) {
							throw new Error('Value must be an array');
						}
						return value.includes(record[field]);
					}

					if (operator === 'contains') {
						const fieldValue = record[field];
						return (
							typeof fieldValue === 'string' &&
							fieldValue.includes(value as string)
						);
					}

					if (operator === 'starts_with') {
						const fieldValue = record[field];
						return (
							typeof fieldValue === 'string' &&
							fieldValue.startsWith(value as string)
						);
					}

					if (operator === 'ends_with') {
						const fieldValue = record[field];
						return (
							typeof fieldValue === 'string' &&
							fieldValue.endsWith(value as string)
						);
					}

					// Default case (equals)
					return record[field] === value;
				});
			});
		},
		getField,
	};
};

export const memoryAdapter =
	(db: MemoryDB) =>
	(options: C15TOptions): Adapter => {
		const { transformInput, transformOutput, convertWhereClause, getField } =
			createTransform(options);

		return {
			id: 'memory',
			async create<
				Model extends EntityName,
				Data extends Record<string, unknown>,
				Result extends TableFields<Model>,
			>(data: {
				model: Model;
				data: Data;
				select?: (keyof Result)[];
			}): Promise<Result> {
				const { model, data: values, select } = data;
				const transformed = transformInput(
					values as EntityInput<Model>,
					model,
					'create'
				);

				// Initialize array if it doesn't exist
				if (!db[model]) {
					db[model] = [];
				}

				db[model].push(transformed);
				return transformOutput(
					transformed,
					model,
					select as string[]
				) as Result;
			},

			async findOne<
				Model extends EntityName,
				Result extends TableFields<Model>,
			>(data: {
				model: Model;
				where: Where<Model>;
				select?: (keyof Result)[];
			}): Promise<Result | null> {
				const { model, where, select } = data;
				const table = db[model] || [];
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const res = convertWhereClause(whereArray, table, model);
				const record = res[0] || null;
				return transformOutput(
					record,
					model,
					select as string[]
				) as Result | null;
			},

			async findMany<
				Model extends EntityName,
				Result extends TableFields<Model>,
			>(data: {
				model: Model;
				where?: Where<Model>;
				limit?: number;
				sortBy?: { field: 'id' | keyof Result; direction: 'asc' | 'desc' };
				offset?: number;
			}): Promise<Result[]> {
				const { model, where, sortBy, limit, offset } = data;
				let table = db[model] || [];

				if (where) {
					// Convert Where from Adapter type to internal WhereCondition type
					const whereArray = (Array.isArray(where)
						? where
						: [where]) as unknown as WhereCondition<Model>[];
					table = convertWhereClause(whereArray, table, model);
				}

				if (sortBy) {
					const field = getField(model, sortBy.field as string);
					table = [...table].sort((a, b) => {
						if (sortBy.direction === 'asc') {
							return (a[field] as number) > (b[field] as number) ? 1 : -1;
						}
						return (a[field] as number) < (b[field] as number) ? 1 : -1;
					});
				}

				let result = table;
				if (offset !== undefined) {
					result = result.slice(offset);
				}
				if (limit !== undefined) {
					result = result.slice(0, limit);
				}

				return result.map((record) => transformOutput(record, model) as Result);
			},

			async count<Model extends EntityName>(data: {
				model: Model;
				where?: Where<Model>;
			}): Promise<number> {
				const { model, where } = data;
				const table = db[model] || [];

				if (!where) {
					return table.length;
				}

				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const filtered = convertWhereClause(whereArray, table, model);
				return filtered.length;
			},

			async update<
				Model extends EntityName,
				Result extends TableFields<Model>,
			>(data: {
				model: Model;
				where: Where<Model>;
				update: Partial<TableFields<Model>>;
			}): Promise<Result | null> {
				const { model, where, update: values } = data;
				const table = db[model] || [];
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const res = convertWhereClause(whereArray, table, model);

				for (const record of res) {
					Object.assign(
						record,
						transformInput(values as EntityInput<Model>, model, 'update')
					);
				}

				return transformOutput(res[0] || null, model) as Result | null;
			},

			async updateMany<
				Model extends EntityName,
				Result extends TableFields<Model>,
			>(data: {
				model: Model;
				where: Where<Model>;
				update: Partial<TableFields<Model>>;
			}): Promise<Result[]> {
				const { model, where, update: values } = data;
				const table = db[model] || [];
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const res = convertWhereClause(whereArray, table, model);

				for (const record of res) {
					Object.assign(
						record,
						transformInput(values as EntityInput<Model>, model, 'update')
					);
				}

				return res.map((record) => transformOutput(record, model) as Result);
			},

			async delete<Model extends EntityName>(data: {
				model: Model;
				where: Where<Model>;
			}): Promise<void> {
				const { model, where } = data;
				const table = db[model] || [];
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const res = convertWhereClause(whereArray, table, model);
				db[model] = table.filter((record) => !res.includes(record));
			},

			async deleteMany<Model extends EntityName>(data: {
				model: Model;
				where: Where<Model>;
			}): Promise<number> {
				const { model, where } = data;
				const table = db[model] || [];
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const res = convertWhereClause(whereArray, table, model);
				let count = 0;

				db[model] = table.filter((record) => {
					if (res.includes(record)) {
						count++;
						return false;
					}
					return true;
				});

				return count;
			},
		};
	};
