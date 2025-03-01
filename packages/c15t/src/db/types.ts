import type {
	FieldAttribute,
	InferFieldsOutput,
	InferFieldsInput,
} from './core/fields';
import type { C15TDBSchema } from './schema/definition';
import type { ModelName, ModelTypeMap, CoreTableName } from './schema/types';

/**
 * Table interface that provides type-safe access to database operations
 * for a specific table
 */
export interface Table<
	TName extends ModelName,
	TFields extends Record<
		string,
		FieldAttribute
	> = C15TDBSchema[TName]['fields'],
	TModel = ModelTypeMap[TName],
	TOutput = InferFieldsOutput<TFields>,
	TInput = InferFieldsInput<TFields>,
> {
	/**
	 * The name of the table
	 */
	readonly name: TName;

	/**
	 * The schema definition of the table
	 */
	readonly schema: {
		fields: TFields;
		modelName: string;
	};

	/**
	 * Finds records in the table
	 */
	find(query?: Partial<TModel>): Promise<TOutput[]>;

	/**
	 * Finds a single record by id
	 */
	findById(id: string | number): Promise<TOutput | null>;

	/**
	 * Finds a single record by query
	 */
	findOne(query: Partial<TModel>): Promise<TOutput | null>;

	/**
	 * Creates a new record
	 */
	create(data: TInput): Promise<TOutput>;

	/**
	 * Updates a record
	 */
	update(id: string | number, data: Partial<TInput>): Promise<TOutput>;

	/**
	 * Deletes a record
	 */
	delete(id: string | number): Promise<void>;

	/**
	 * Counts records matching a query
	 */
	count(query?: Partial<TModel>): Promise<number>;
}

/**
 * Core tables that are guaranteed to exist in the database
 */
export type RequiredCoreTables = {
	[K in CoreTableName]: Table<K>;
};

/**
 * Optional plugin tables that may exist in the database
 */
export type OptionalPluginTables = {
	[K in Exclude<ModelName, CoreTableName>]?: Table<K>;
};

/**
 * Complete database tables combining core and plugin tables
 */
export type RequiredTables = RequiredCoreTables & OptionalPluginTables;

/**
 * Complete database interface providing type-safe access to all tables
 */
export interface Database {
	/**
	 * Access to all tables with proper typing
	 */
	tables: RequiredTables;

	/**
	 * Run a raw SQL query
	 */
	query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

	/**
	 * Begin a transaction
	 */
	transaction<T>(callback: (db: Database) => Promise<T>): Promise<T>;

	/**
	 * Get a specific table with type safety
	 */
	getTable<T extends ModelName>(name: T): Table<T>;
}

/**
 * Type helper to extract all table names from the database
 */
export type DatabaseTableNames = keyof Database['tables'];

/**
 * Type helper to get a specific table's output type
 */
export type TableOutput<T extends ModelName> = InferFieldsOutput<
	C15TDBSchema[T]['fields']
>;

/**
 * Type helper to get a specific table's input type
 */
export type TableInput<T extends ModelName> = InferFieldsInput<
	C15TDBSchema[T]['fields']
>;
