import type { C15TOptions } from '~/types';
import type { KyselyAdapterConfig } from './kysely-adapter';
import type { ModelName, ModelTypeMap } from '~/db/core/types';

/**
 * Adapter where clause
 */
export type Where = {
	operator?:
		| 'eq'
		| 'ne'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'contains'
		| 'starts_with'
		| 'ends_with'; //eq by default
	value: string | number | boolean | string[] | number[] | Date | null;
	field: keyof ModelTypeMap[ModelName];
	connector?: 'AND' | 'OR'; //AND by default
};

/**
 * Adapter Interface
 */
export type Adapter = {
	id: string;
	create: <T extends Record<string, unknown>, R = T>(data: {
		model: ModelName;
		data: T;
		select?: string[];
	}) => Promise<R>;
	findOne: <T>(data: {
		model: ModelName;
		where: Where[];
		select?: string[];
	}) => Promise<T | null>;
	findMany: <T>(data: {
		model: ModelName;
		where?: Where[];
		limit?: number;
		sortBy?: {
			field: string;
			direction: 'asc' | 'desc';
		};
		offset?: number;
	}) => Promise<T[]>;
	count: (data: {
		model: ModelName;
		where?: Where[];
	}) => Promise<number>;
	/**
	 * ⚠︎ Update may not return the updated data
	 * if multiple where clauses are provided
	 */
	update: <T>(data: {
		model: ModelName;
		where: Where[];
		update: Record<string, unknown>;
	}) => Promise<T | null>;
	updateMany: (data: {
		model: ModelName;
		where: Where[];
		update: Record<string, unknown>;
	}) => Promise<number>;
	delete: (data: { model: ModelName; where: Where[] }) => Promise<void>;
	deleteMany: (data: { model: ModelName; where: Where[] }) => Promise<number>;
	/**
	 *
	 * @param options
	 * @param file - file path if provided by the user
	 */
	createSchema?: (
		options: C15TOptions,
		file?: string
	) => Promise<AdapterSchemaCreation>;
	options?: KyselyAdapterConfig | Record<string, unknown>;
};

export type AdapterSchemaCreation = {
	/**
	 * Code to be inserted into the file
	 */
	code: string;
	/**
	 * Path to the file, including the file name and extension.
	 * Relative paths are supported, with the current working directory of the developer's project as the base.
	 */
	path: string;
	/**
	 * Append the file if it already exists.
	 * Note: This will not apply if `overwrite` is set to true.
	 */
	append?: boolean;
	/**
	 * Overwrite the file if it already exists
	 */
	overwrite?: boolean;
};

export type AdapterInstance = (options: C15TOptions) => Adapter;
