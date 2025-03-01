import type { C15TOptions } from '~/types';
import type { KyselyAdapterConfig } from './kysely-adapter';
import type { EntityName } from '../db/core/types';
import type { C15TDBSchema, TableFields } from '../db/schema/definition';

/**
 * Generic Where clause type that's restricted to fields of a specific model
 */
export type Where<T extends EntityName> = {
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
	value: Value;
	field: keyof TableFields<T> | 'id'; // Restricted to actual field names of model T
	connector?: 'AND' | 'OR'; //AND by default
}[];

export type Value =
	| string
	| number
	| boolean
	| string[]
	| number[]
	| Date
	| null;

export type Tables<T extends EntityName> = C15TDBSchema[T]['fields'] & {
	type: 'string';
	fieldName: string;
};

/**
 * Adapter Interface
 */
export type Adapter = {
	id: string;
	create: <
		Model extends EntityName,
		Data extends Record<string, unknown>,
		Result extends TableFields<Model>,
	>(data: {
		model: Model;
		data: Data;
		select?: Array<keyof Result>;
	}) => Promise<Result>;
	findOne: <Model extends EntityName, Result extends TableFields<Model>>(data: {
		model: Model;
		where: Where<Model>;
		select?: Array<keyof Result>;
	}) => Promise<Result | null>;
	findMany: <
		Model extends EntityName,
		Result extends TableFields<Model>,
	>(data: {
		model: Model;
		where?: Where<Model>;
		limit?: number;
		sortBy?: {
			field: keyof Result | 'id';
			direction: 'asc' | 'desc';
		};
		offset?: number;
	}) => Promise<Result[]>;
	count: <Model extends EntityName>(data: {
		model: Model;
		where?: Where<Model>;
	}) => Promise<number>;
	/**
	 * ⚠︎ Update may not return the updated data
	 * if multiple where clauses are provided
	 */
	update: <Model extends EntityName, Result extends TableFields<Model>>(data: {
		model: Model;
		where: Where<Model>;
		update: Partial<TableFields<Model>>;
	}) => Promise<Result | null>;
	updateMany: <
		Model extends EntityName,
		Result extends TableFields<Model>,
	>(data: {
		model: Model;
		where: Where<Model>;
		update: Partial<TableFields<Model>>;
	}) => Promise<Result[]>;
	delete: <Model extends EntityName>(data: {
		model: Model;
		where: Where<Model>;
	}) => Promise<void>;
	deleteMany: <Model extends EntityName>(data: {
		model: Model;
		where: Where<Model>;
	}) => Promise<number>;
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
