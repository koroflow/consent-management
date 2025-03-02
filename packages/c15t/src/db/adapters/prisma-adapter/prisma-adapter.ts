//@ts-nocheck

import { getConsentTables } from '../..';
import { C15TError } from '~/error';
import type { Adapter, C15TOptions, Where } from '~/types';
import { generateId } from '~/utils';
import { applyDefaultValue } from '../utils';

export interface PrismaConfig {
	/**
	 * Database provider.
	 */
	provider:
		| 'sqlite'
		| 'cockroachdb'
		| 'mysql'
		| 'postgresql'
		| 'sqlserver'
		| 'mongodb';
}

type PrismaClient = Record<string, unknown>;
type data = Record<string, unknown>;
interface PrismaClientInternal {
	[model: string]: {
		create: (data: data) => Promise<data>;
		findFirst: (data: data) => Promise<data>;
		findMany: (data: data) => Promise<data>;
		update: (data: data) => Promise<data>;
		delete: (data: data) => Promise<data>;
		[key: string]: data;
	};
}

const createEntityTransformer = (
	_config: PrismaConfig,
	options: C15TOptions
) => {
	const schema = getConsentTables(options);

	function getField(model: string, field: string) {
		if (field === 'id') {
			return field;
		}
		const f = schema[model].fields[field];
		return f.fieldName || field;
	}

	function operatorToPrismaOperator(operator: string) {
		switch (operator) {
			case 'starts_with':
				return 'startsWith';
			case 'ends_with':
				return 'endsWith';
			default:
				return operator;
		}
	}

	function getEntityName(model: string) {
		return schema[model].entityName;
	}

	const useDatabaseGeneratedId = options?.advanced?.generateId === false;
	return {
		transformInput(
			data: Record<string, unknown>,
			model: string,
			action: 'create' | 'update'
		) {
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
					const value = data[field];
					if (
						value === undefined &&
						(!fields[field].defaultValue || action === 'update')
					) {
						continue;
					}
					transformedData[fields[field].fieldName || field] = applyDefaultValue(
						value,
						fields[field],
						action
					);
				}
			}
			return transformedData;
		},
		transformOutput(
			data: Record<string, unknown>,
			model: string,
			select: string[] = []
		) {
			if (!data) {
				return null;
			}

			let transformedData: Record<string, unknown> = {};

			if (
				(data.id || data._id) &&
				(select.length === 0 || select.includes('id'))
			) {
				transformedData = { id: data.id };
			}

			const tableSchema = schema[model].fields;
			for (const key in tableSchema) {
				if (select.length && !select.includes(key)) {
					continue;
				}
				const field = tableSchema[key];
				if (field) {
					transformedData[key] = data[field.fieldName || key];
				}
			}
			return transformedData as unknown;
		},
		convertWhereClause<T>(model: T, where?: Where<T>[]) {
			if (!where) {
				return {};
			}
			if (where.length === 1) {
				const w = where[0];
				if (!w) {
					return;
				}
				return {
					[getField(model, w.field)]:
						w.operator === 'eq' || !w.operator
							? w.value
							: {
									[operatorToPrismaOperator(w.operator)]: w.value,
								},
				};
			}
			const and = where.filter((w) => w.connector === 'AND' || !w.connector);
			const or = where.filter((w) => w.connector === 'OR');
			const andClause = and.map((w) => {
				return {
					[getField(model, w.field)]:
						w.operator === 'eq' || !w.operator
							? w.value
							: {
									[operatorToPrismaOperator(w.operator)]: w.value,
								},
				};
			});
			const orClause = or.map((w) => {
				return {
					[getField(model, w.field)]: {
						[w.operator || 'eq']: w.value,
					},
				};
			});

			return {
				...(andClause.length ? { AND: andClause } : {}),
				...(orClause.length ? { OR: orClause } : {}),
			};
		},
		convertSelect: (select?: string[], model?: string) => {
			if (!select || !model) {
				return undefined;
			}
			return select.reduce((prev, cur) => {
				const field = getField(model, cur);
				return Object.assign({}, prev, { [field]: true });
			}, {});
		},
		getEntityName,
		getField,
	};
};

export const prismaAdapter =
	(prisma: PrismaClient, config: PrismaConfig) => (options: C15TOptions) => {
		const db = prisma as PrismaClientInternal;
		const {
			transformInput,
			transformOutput,
			convertWhereClause,
			convertSelect,
			getEntityName,
			getField,
		} = createEntityTransformer(config, options);
		return {
			id: 'prisma',
			async create(data) {
				const { model, data: values, select } = data;
				const transformed = transformInput(values, model, 'create');
				if (!db[getEntityName(model)]) {
					throw new C15TError(
						`Model ${model} does not exist in the database. If you haven't generated the Prisma client, you need to run 'npx prisma generate'`
					);
				}
				const result = await db[getEntityName(model)].create({
					data: transformed,
					select: convertSelect(select, model),
				});
				return transformOutput(result, model, select);
			},
			async findOne(data) {
				const { model, where, select } = data;
				const whereClause = convertWhereClause(model, where);
				if (!db[getEntityName(model)]) {
					throw new C15TError(
						`Model ${model} does not exist in the database. If you haven't generated the Prisma client, you need to run 'npx prisma generate'`
					);
				}
				const result = await db[getEntityName(model)].findFirst({
					where: whereClause,
					select: convertSelect(select, model),
				});
				return transformOutput(result, model, select);
			},
			async findMany(data) {
				const { model, where, limit, offset, sortBy } = data;
				const whereClause = convertWhereClause(model, where);
				if (!db[getEntityName(model)]) {
					throw new C15TError(
						`Model ${model} does not exist in the database. If you haven't generated the Prisma client, you need to run 'npx prisma generate'`
					);
				}

				const result = (await db[getEntityName(model)].findMany({
					where: whereClause,
					take: limit || 100,
					skip: offset || 0,
					...(sortBy?.field
						? {
								orderBy: {
									[getField(model, sortBy.field)]:
										sortBy.direction === 'desc' ? 'desc' : 'asc',
								},
							}
						: {}),
				})) as unknown[];
				return result.map((r) => transformOutput(r, model));
			},
			async count(data) {
				const { model, where } = data;
				const whereClause = convertWhereClause(model, where);
				if (!db[getEntityName(model)]) {
					throw new C15TError(
						`Model ${model} does not exist in the database. If you haven't generated the Prisma client, you need to run 'npx prisma generate'`
					);
				}
				const result = await db[getEntityName(model)].count({
					where: whereClause,
				});
				return result;
			},
			async update(data) {
				const { model, where, update } = data;
				if (!db[getEntityName(model)]) {
					throw new C15TError(
						`Model ${model} does not exist in the database. If you haven't generated the Prisma client, you need to run 'npx prisma generate'`
					);
				}
				const whereClause = convertWhereClause(model, where);
				const transformed = transformInput(update, model, 'update');
				const result = await db[getEntityName(model)].update({
					where: whereClause,
					data: transformed,
				});
				return transformOutput(result, model);
			},
			async updateMany(data) {
				const { model, where, update } = data;
				const whereClause = convertWhereClause(model, where);
				const transformed = transformInput(update, model, 'update');
				const result = await db[getEntityName(model)].updateMany({
					where: whereClause,
					data: transformed,
				});
				return result ? (result.count as number) : 0;
			},
			async delete(data) {
				const { model, where } = data;
				const whereClause = convertWhereClause(model, where);
				try {
					await db[getEntityName(model)].delete({
						where: whereClause,
					});
				} catch {
					// If the record doesn't exist, we don't want to throw an error
				}
			},
			async deleteMany(data) {
				const { model, where } = data;
				const whereClause = convertWhereClause(model, where);
				const result = await db[getEntityName(model)].deleteMany({
					where: whereClause,
				});
				return result ? (result.count as number) : 0;
			},
			options: config,
		} satisfies Adapter;
	};
