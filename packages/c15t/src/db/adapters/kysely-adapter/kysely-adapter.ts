import type {
	BinaryOperatorExpression,
	OperandValueExpressionOrList,
} from 'node_modules/kysely/dist/esm/parser/binary-operation-parser';
import { getConsentTables } from '../..';
import type { Adapter, C15TOptions, Where } from '../../../types';
import { generateId } from '../../../utils';
import { applyDefaultValue } from '../utils';
import type { Database, KyselyDatabaseType } from './types';
import type {
	ExpressionBuilder,
	ExpressionOrFactory,
	InsertQueryBuilder,
	Kysely,
	OperandExpression,
	ReferenceExpression,
	SqlBool,
	UpdateQueryBuilder,
} from 'kysely';
import type {
	EntityName,
	EntityTypeMap,
	EntityInput,
	EntityOutput,
} from '~/db/core/types';
import type { TableReference } from 'node_modules/kysely/dist/esm/parser/table-parser';
import type { TableFields } from '~/db/schema/definition';
import type { Field, Primitive } from '~/db/core/fields';
import type { InsertExpression } from 'node_modules/kysely/dist/esm/parser/insert-values-parser';

// Define an intermediate interface for Kysely field references
type KyselyFieldRef = ReferenceExpression<Database, keyof Database>;

// Type for expression builder function
type ExpressionFn = (
	eb: ExpressionBuilder<Database, keyof Database>
) => unknown;

// Define a common interface for where conditions
export interface WhereCondition<T extends EntityName> {
	field: keyof EntityTypeMap[T] | 'id';
	value: unknown;
	operator?:
		| 'in'
		| 'eq'
		| 'ne'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| '=';
	connector?: 'AND' | 'OR';
}

export interface KyselyAdapterConfig {
	/**
	 * Database type.
	 */
	type?: KyselyDatabaseType;
}

// Note: Throughout this adapter, we use "as any" type assertions in several places
// to bridge the gap between our runtime-generated field references and Kysely's
// strongly typed query builder. This is necessary due to the dynamic nature of our
// schema, where field names and references are determined at runtime.
// An alternative approach would be to generate fully typed interfaces at build time.

const createTransform = (
	db: Kysely<Database>,
	options: C15TOptions,
	config?: KyselyAdapterConfig
) => {
	const schema = getConsentTables(options);

	function getField<T extends EntityName>(
		model: T,
		field: keyof EntityTypeMap[T] | string
	) {
		if (field === 'id') {
			return field;
		}
		const modelFields = schema[model]?.fields;
		const f = modelFields
			? (modelFields as Record<string, Field>)[field as string]
			: undefined;
		if (!f) {
			// biome-ignore lint/suspicious/noConsoleLog: <explanation>
			// biome-ignore lint/suspicious/noConsole: <explanation>
			console.log('Field not found', model, field);
		}
		return f?.fieldName || (field as string);
	}

	function transformValueToDB<T extends EntityName>(
		value: unknown,
		model: T,
		field: keyof EntityTypeMap[T] | string
	): unknown {
		if (field === 'id') {
			return value;
		}
		const { type = 'sqlite' } = config || {};
		const modelFields = schema[model]?.fields;
		const f = modelFields
			? (modelFields as Record<string, Field>)[field as string]
			: undefined;
		if (
			f?.type === 'boolean' &&
			(type === 'sqlite' || type === 'mssql') &&
			value !== null &&
			value !== undefined
		) {
			return value ? 1 : 0;
		}
		if (f?.type === 'date' && value && value instanceof Date) {
			return type === 'sqlite' ? value.toISOString() : value;
		}
		return value;
	}

	function transformValueFromDB<T extends EntityName>(
		value: unknown,
		model: T,
		field: keyof EntityTypeMap[T] | string
	): unknown {
		const { type = 'sqlite' } = config || {};

		const modelFields = schema[model]?.fields;
		const f = modelFields
			? (modelFields as Record<string, Field>)[field as string]
			: undefined;
		if (
			f?.type === 'boolean' &&
			(type === 'sqlite' || type === 'mssql') &&
			value !== null
		) {
			return value === 1;
		}
		if (f?.type === 'date' && value) {
			return new Date(value as string);
		}
		return value;
	}

	function getEntityName<T extends EntityName>(
		model: T
	): TableReference<Database> {
		return schema[model].entityName as TableReference<Database>;
	}

	// Check if generateId option is explicitly set to false
	//@ts-expect-error
	const useDatabaseGeneratedId = options?.advanced?.generateId === false;

	return {
		transformInput<T extends EntityName>(
			data: EntityInput<T>,
			model: T,
			action: 'create' | 'update'
		): InsertExpression<Database, keyof Database> {
			const transformedData: Record<string, unknown> =
				useDatabaseGeneratedId || action === 'update'
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
				if (Object.hasOwn(fields, field)) {
					const value = data[field as keyof typeof data];
					const fieldInfo = (fields as Record<string, Field>)[field];
					const fieldName = fieldInfo?.fieldName || field;
					if (fieldInfo) {
						transformedData[fieldName] = applyDefaultValue(
							transformValueToDB(value, model, field) as Primitive,
							fieldInfo,
							action
						);
					}
				}
			}
			return transformedData as InsertExpression<Database, keyof Database>;
		},
		transformOutput<T extends EntityName>(
			data: Record<string, unknown> | null,
			model: T,
			select: string[] = []
		): EntityOutput<T> | null {
			if (!data) {
				return null;
			}
			const transformedData: Record<string, unknown> = data.id
				? // biome-ignore lint/nursery/noNestedTernary: <explanation>
					select.length === 0 || select.includes('id')
					? {
							id: data.id,
						}
					: {}
				: {};
			const tableSchema = schema[model]?.fields;
			for (const key in tableSchema) {
				if (select.length && !select.includes(key)) {
					continue;
				}
				const field = (tableSchema as Record<string, Field>)[key];
				if (field) {
					transformedData[key] = transformValueFromDB(
						data[field.fieldName || key],
						model,
						key
					);
				}
			}
			return transformedData as EntityOutput<T>;
		},
		convertWhereClause<T extends EntityName>(
			model: T,
			whereConditions?: WhereCondition<T>[]
		): {
			and: ExpressionFn[] | null;
			or: ExpressionFn[] | null;
		} {
			if (!whereConditions || whereConditions.length === 0) {
				return {
					and: null,
					or: null,
				};
			}

			const conditions = {
				and: [] as ExpressionFn[],
				or: [] as ExpressionFn[],
			};

			for (const condition of whereConditions) {
				let {
					field: _field,
					value,
					operator = '=',
					connector = 'AND',
				} = condition;
				const fieldString = getField<T>(model, _field);
				value = transformValueToDB<T>(value, model, _field);

				const expr: ExpressionFn = (eb) => {
					// For type safety, cast field to a reference expression
					// The double-casting pattern works better than direct any casts
					const dbField = fieldString as unknown as KyselyFieldRef;

					if (operator.toLowerCase() === 'in') {
						return eb(dbField, 'in', Array.isArray(value) ? value : [value]);
					}

					if (operator === 'contains') {
						return eb(dbField, 'like', `%${value}%`);
					}

					if (operator === 'starts_with') {
						return eb(dbField, 'like', `${value}%`);
					}

					if (operator === 'ends_with') {
						return eb(dbField, 'like', `%${value}`);
					}

					if (operator === 'eq') {
						return eb(dbField, '=', value);
					}

					if (operator === 'ne') {
						return eb(dbField, '<>', value);
					}

					if (operator === 'gt') {
						return eb(dbField, '>', value);
					}

					if (operator === 'gte') {
						return eb(dbField, '>=', value);
					}

					if (operator === 'lt') {
						return eb(dbField, '<', value);
					}

					if (operator === 'lte') {
						return eb(dbField, '<=', value);
					}

					return eb(dbField, operator as BinaryOperatorExpression, value);
				};

				if (connector === 'OR') {
					conditions.or.push(expr);
				} else {
					conditions.and.push(expr);
				}
			}

			return {
				and: conditions.and.length ? conditions.and : null,
				or: conditions.or.length ? conditions.or : null,
			};
		},
		async withReturning<T extends EntityName>(
			values: EntityInput<T>,
			builder:
				| InsertQueryBuilder<Database, keyof Database, keyof Database>
				| UpdateQueryBuilder<
						Database,
						keyof Database,
						keyof Database,
						keyof Database
				  >,
			model: T,
			where: WhereCondition<T>[]
		): Promise<Record<string, unknown> | null> {
			let res: Record<string, unknown> | null = null;
			if (config?.type === 'mysql') {
				//this isn't good, but kysely doesn't support returning in mysql and it doesn't return the inserted id. Change this if there is a better way.
				await builder.execute();
				// Get the field and value to find the created/updated record
				const whereCondition = where[0];
				const field = values.id
					? 'id'
					: ((whereCondition?.field ?? 'id') as string);
				const value =
					values[field as keyof typeof values] ?? whereCondition?.value;

				// Safe cast for where field
				const fieldString = getField(
					model,
					field
				) as unknown as ExpressionOrFactory<
					Database,
					keyof Database,
					KyselyFieldRef
				>;

				res = (await db
					.selectFrom(getEntityName(model))
					.selectAll()
					.where((eb) =>
						eb(
							fieldString,
							'=',
							value as OperandValueExpressionOrList<
								Database,
								keyof Database,
								KyselyFieldRef
							>
						)
					)
					.executeTakeFirst()) as Record<string, unknown> | null;
				return res;
			}
			if (config?.type === 'mssql') {
				res = (await builder
					.outputAll('inserted')
					.executeTakeFirst()) as Record<string, unknown> | null;
				return res;
			}
			res = (await builder.returningAll().executeTakeFirst()) as Record<
				string,
				unknown
			> | null;
			return res;
		},
		getEntityName,
		getField,
	};
};

export const kyselyAdapter =
	(db: Kysely<Database>, config?: KyselyAdapterConfig) =>
	(opts: C15TOptions): Adapter => {
		const {
			transformInput,
			withReturning,
			transformOutput,
			convertWhereClause,
			getEntityName,
			getField,
		} = createTransform(db, opts, config);
		return {
			id: 'kysely',
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

				// Safe cast for table name
				const tableName = getEntityName(model);

				// Use type assertion for builder to match Kysely's expectations
				const builder = db
					.insertInto(tableName as keyof Database)
					.values(transformed);

				const result = await withReturning(
					transformed as EntityInput<Model>,
					builder as unknown as InsertQueryBuilder<
						Database,
						keyof Database,
						keyof Database
					>,
					model,
					[]
				);
				return transformOutput(
					result,
					model,
					select as string[]
				) as unknown as Result;
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
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const { and, or } = convertWhereClause(model, whereArray);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db
					.selectFrom(tableName as unknown as keyof Database)
					.selectAll();

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				const res = await query.executeTakeFirst();
				if (!res) {
					return null;
				}
				return transformOutput(
					res as Record<string, unknown>,
					model,
					select as string[]
				) as unknown as Result | null;
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
				const { model, where, limit, offset, sortBy } = data;
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = where
					? ((Array.isArray(where)
							? where
							: [where]) as unknown as WhereCondition<Model>[])
					: undefined;
				const { and, or } = convertWhereClause(model, whereArray);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db.selectFrom(tableName as unknown as keyof Database);

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				if (config?.type === 'mssql') {
					if (!offset) {
						query = query.top(limit || 100);
					}
				} else {
					query = query.limit(limit || 100);
				}
				if (sortBy) {
					// Safe cast for sort field
					const sortFieldString = getField(model, sortBy.field as string);

					query = query.orderBy(
						sortFieldString as unknown as KyselyFieldRef,
						sortBy.direction
					);
				}
				if (offset) {
					if (config?.type === 'mssql') {
						if (!sortBy) {
							// Safe cast for id field
							query = query.orderBy('id' as unknown as KyselyFieldRef);
						}
						query = query.offset(offset).fetch(limit || 100);
					} else {
						query = query.offset(offset);
					}
				}

				const res = await query.selectAll().execute();
				if (!res) {
					return [] as unknown as Result[];
				}
				return res.map(
					(r) =>
						transformOutput(
							r as Record<string, unknown>,
							model
						) as unknown as Result
				);
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
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const { and, or } = convertWhereClause(model, whereArray);
				const transformedData = transformInput(
					values as EntityInput<Model>,
					model,
					'update'
				);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db
					.updateTable(tableName as unknown as keyof Database)
					.set(transformedData as Record<string, unknown>);

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				const result = await withReturning(
					transformedData as EntityInput<Model>,
					query as unknown as UpdateQueryBuilder<
						Database,
						keyof Database,
						keyof Database,
						keyof Database
					>,
					model,
					whereArray
				);
				return transformOutput(result, model) as unknown as Result | null;
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
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const { and, or } = convertWhereClause(model, whereArray);
				const transformedData = transformInput(
					values as EntityInput<Model>,
					model,
					'update'
				);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db
					.updateTable(tableName as unknown as keyof Database)
					.set(transformedData as Record<string, unknown>);

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				await query.execute();

				// After update is complete, fetch the updated records using the same where conditions
				// Safe cast for table name
				let selectQuery = db
					.selectFrom(tableName as unknown as keyof Database)
					.selectAll();

				if (and) {
					selectQuery = selectQuery.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					selectQuery = selectQuery.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}

				const fetchedResults = await selectQuery.execute();

				// Transform the results using the same pattern as findMany
				if (!fetchedResults || fetchedResults.length === 0) {
					return [] as unknown as Result[];
				}

				return fetchedResults.map(
					(record) =>
						transformOutput(
							record as Record<string, unknown>,
							model
						) as unknown as Result
				);
			},
			async count<Model extends EntityName>(data: {
				model: Model;
				where?: Where<Model>;
			}): Promise<number> {
				const { model, where } = data;
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = where
					? ((Array.isArray(where)
							? where
							: [where]) as unknown as WhereCondition<Model>[])
					: undefined;
				const { and, or } = convertWhereClause(model, whereArray);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db
					.selectFrom(tableName as unknown as keyof Database)
					//@ts-expect-error
					.select((eb) => eb.fn.count<number>('id').as('count'));

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				const res = await query.execute();
				// Get count from result
				const count = (res[0] as Record<string, unknown>)?.count;
				return typeof count === 'number' ? count : 0;
			},
			async delete<Model extends EntityName>(data: {
				model: Model;
				where: Where<Model>;
			}): Promise<void> {
				const { model, where } = data;
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const { and, or } = convertWhereClause(model, whereArray);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db.deleteFrom(tableName as unknown as keyof Database);

				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}

				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				await query.execute();
			},
			async deleteMany<Model extends EntityName>(data: {
				model: Model;
				where: Where<Model>;
			}): Promise<number> {
				const { model, where } = data;
				// Convert Where from Adapter type to internal WhereCondition type
				const whereArray = (Array.isArray(where)
					? where
					: [where]) as unknown as WhereCondition<Model>[];
				const { and, or } = convertWhereClause(model, whereArray);

				// Safe cast for table name
				const tableName = getEntityName(model);
				let query = db.deleteFrom(tableName as unknown as keyof Database);
				if (and) {
					query = query.where((eb) => {
						const conditions = and.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.and(conditions);
					});
				}
				if (or) {
					query = query.where((eb) => {
						const conditions = or.map((expr) =>
							expr(eb)
						) as OperandExpression<SqlBool>[];
						return eb.or(conditions);
					});
				}
				const result = await query.execute();
				const count = result.length;
				return count;
			},
			options: config,
		};
	};
