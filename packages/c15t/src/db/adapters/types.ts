import type { C15TOptions } from '~/types';
import type { KyselyAdapterConfig } from './kysely-adapter';
import type { EntityName } from '../core/types';
import type { C15TDBSchema, TableFields } from '../schema/definition';

/**
 * Generic Where clause type for database queries
 *
 * This type defines the structure of query conditions used across all database adapters.
 * It allows for complex queries with various operators and connectors
 * while ensuring type safety by restricting fields to those that actually
 * exist on the model being queried.
 *
 * @typeParam EntityType - The entity type being queried
 *
 * @example
 * ```typescript
 * // Single condition (equality)
 * const simpleWhere: Where<'consent'> = [
 *   { field: 'userId', value: 'user-123' }
 * ];
 *
 * // Multiple conditions with AND (default connector)
 * const multipleWhere: Where<'consent'> = [
 *   { field: 'userId', value: 'user-123' },
 *   { field: 'allowed', value: true }
 * ];
 *
 * // Complex query with different operators
 * const complexWhere: Where<'consent'> = [
 *   { field: 'purposeId', value: ['marketing', 'analytics'], operator: 'in' },
 *   { field: 'updatedAt', value: new Date('2023-01-01'), operator: 'gt' },
 *   { field: 'userId', value: 'user-456', connector: 'OR' }
 * ];
 * ```
 */
export type Where<EntityType extends EntityName> = {
	/**
	 * The comparison operator to use
	 *
	 * @default "eq" (equality)
	 */
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
		| 'ends_with';

	/**
	 * The value to compare against
	 */
	value: Value;

	/**
	 * The field to apply the condition to
	 *
	 * This is restricted to actual field names that exist on the model
	 * plus the special 'id' field which is common to all models.
	 */
	field: keyof TableFields<EntityType> | 'id';

	/**
	 * The logical connector to use with previous conditions
	 *
	 * @default "AND"
	 */
	connector?: 'AND' | 'OR';
}[];

/**
 * Represents the possible value types that can be used in query conditions
 *
 * This type encompasses all primitive values that can be stored in the
 * database and used in query conditions.
 */
export type Value =
	| string
	| number
	| boolean
	| string[]
	| number[]
	| Date
	| null;

/**
 * Represents the database tables structure for a specific entity
 *
 * @typeParam EntityType - The entity type for which to get table fields
 *
 * @internal Used internally by adapter implementations
 */
export type Tables<EntityType extends EntityName> =
	C15TDBSchema[EntityType]['fields'] & {
		type: 'string';
		fieldName: string;
	};

/**
 * Adapter Interface for database operations
 *
 * This interface defines the contract that all database adapters must implement.
 * It provides a consistent API for database operations across different database types,
 * allowing c15t to work with various databases without changes to core code.
 *
 * @remarks
 * When implementing a custom adapter, all methods must be implemented according to this interface.
 * The adapter is responsible for translating c15t's abstract operations into database-specific
 * queries and handling the conversion between c15t's data format and the database format.
 *
 * @example
 * ```typescript
 * // Example usage in a c15t instance
 * import { c15t } from '@c15t/core';
 * import { memoryAdapter } from '@c15t/adapters/memory';
 *
 * const consentManager = c15t({
 *   storage: memoryAdapter({}),
 *   secret: 'your-secret-key'
 * });
 * ```
 */
export type Adapter = {
	/**
	 * Unique identifier for the adapter
	 */
	id: string;

	/**
	 * Creates a new record in the database
	 *
	 * @typeParam Model - The model/entity type
	 * @typeParam Data - The input data type
	 * @typeParam Result - The expected result type
	 *
	 * @param data - Object containing model, data, and optional fields to select
	 * @returns Promise resolving to the created record
	 *
	 * @example
	 * ```typescript
	 * const newConsent = await adapter.create({
	 *   model: 'consent',
	 *   data: { userId: 'user-123', purposeId: 'marketing', allowed: true },
	 *   select: ['id', 'userId', 'allowed']
	 * });
	 * ```
	 */
	create: <
		Model extends EntityName,
		Data extends Record<string, unknown>,
		Result extends TableFields<Model>,
	>(data: {
		model: Model;
		data: Data;
		select?: Array<keyof Result>;
	}) => Promise<Result>;

	/**
	 * Finds a single record matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 * @typeParam Result - The expected result type
	 *
	 * @param data - Object containing model, where conditions, and optional fields to select
	 * @returns Promise resolving to the found record or null if not found
	 *
	 * @example
	 * ```typescript
	 * const consent = await adapter.findOne({
	 *   model: 'consent',
	 *   where: [{ field: 'id', value: 'consent-123' }],
	 *   select: ['userId', 'purposeId', 'allowed']
	 * });
	 * ```
	 */
	findOne: <Model extends EntityName, Result extends TableFields<Model>>(data: {
		model: Model;
		where: Where<Model>;
		select?: Array<keyof Result>;
	}) => Promise<Result | null>;

	/**
	 * Finds multiple records matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 * @typeParam Result - The expected result type
	 *
	 * @param data - Object containing model, optional where conditions, limit, sorting options, and offset
	 * @returns Promise resolving to an array of matching records
	 *
	 * @example
	 * ```typescript
	 * const consents = await adapter.findMany({
	 *   model: 'consent',
	 *   where: [{ field: 'userId', value: 'user-123' }],
	 *   limit: 20,
	 *   offset: 0,
	 *   sortBy: { field: 'createdAt', direction: 'desc' }
	 * });
	 * ```
	 */
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

	/**
	 * Counts records matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 *
	 * @param data - Object containing model and optional where conditions
	 * @returns Promise resolving to the count of matching records
	 *
	 * @example
	 * ```typescript
	 * const consentCount = await adapter.count({
	 *   model: 'consent',
	 *   where: [
	 *     { field: 'purposeId', value: 'marketing' },
	 *     { field: 'allowed', value: true }
	 *   ]
	 * });
	 * ```
	 */
	count: <Model extends EntityName>(data: {
		model: Model;
		where?: Where<Model>;
	}) => Promise<number>;

	/**
	 * Updates a single record matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 * @typeParam Result - The expected result type
	 *
	 * @param data - Object containing model, where conditions, and update data
	 * @returns Promise resolving to the updated record or null if not found
	 *
	 * @remarks
	 * This method may not return the updated data if multiple where clauses are provided,
	 * as some database adapters cannot reliably return data when multiple records match.
	 *
	 * @example
	 * ```typescript
	 * const updatedConsent = await adapter.update({
	 *   model: 'consent',
	 *   where: [{ field: 'id', value: 'consent-123' }],
	 *   update: { allowed: false }
	 * });
	 * ```
	 */
	update: <Model extends EntityName, Result extends TableFields<Model>>(data: {
		model: Model;
		where: Where<Model>;
		update: Partial<TableFields<Model>>;
	}) => Promise<Result | null>;

	/**
	 * Updates multiple records matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 * @typeParam Result - The expected result type
	 *
	 * @param data - Object containing model, where conditions, and update data
	 * @returns Promise resolving to the number of records updated
	 *
	 * @example
	 * ```typescript
	 * const updatedCount = await adapter.updateMany({
	 *   model: 'consent',
	 *   where: [{ field: 'userId', value: 'user-123' }],
	 *   update: { allowed: false }
	 * });
	 * ```
	 */
	updateMany: <
		Model extends EntityName,
		Result extends TableFields<Model>,
	>(data: {
		model: Model;
		where: Where<Model>;
		update: Partial<TableFields<Model>>;
	}) => Promise<Result[]>;

	/**
	 * Deletes a single record matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 *
	 * @param data - Object containing model and where conditions
	 * @returns Promise resolving when the operation is complete
	 *
	 * @example
	 * ```typescript
	 * await adapter.delete({
	 *   model: 'consent',
	 *   where: [{ field: 'id', value: 'consent-123' }]
	 * });
	 * ```
	 */
	delete: <Model extends EntityName>(data: {
		model: Model;
		where: Where<Model>;
	}) => Promise<void>;

	/**
	 * Deletes multiple records matching the where conditions
	 *
	 * @typeParam Model - The model/entity type
	 *
	 * @param data - Object containing model and where conditions
	 * @returns Promise resolving to the number of records deleted
	 *
	 * @example
	 * ```typescript
	 * const deletedCount = await adapter.deleteMany({
	 *   model: 'consent',
	 *   where: [{ field: 'userId', value: 'user-123' }]
	 * });
	 * ```
	 */
	deleteMany: <Model extends EntityName>(data: {
		model: Model;
		where: Where<Model>;
	}) => Promise<number>;

	/**
	 * Optional method to create database schema
	 *
	 * This method generates and applies database schema for the adapter.
	 * It's optional and only required for adapters that support schema creation.
	 *
	 * @param options - c15t configuration options
	 * @param file - Optional file path provided by the user
	 * @returns Promise resolving to schema creation result
	 */
	createSchema?: (
		options: C15TOptions,
		file?: string
	) => Promise<AdapterSchemaCreation>;

	/**
	 * Optional adapter-specific configuration
	 */
	options?: KyselyAdapterConfig | Record<string, unknown>;
};

/**
 * Result of schema creation operation
 *
 * This type defines the structure of the result from a schema creation operation.
 * It includes information about generated code, target file paths, and file operation options.
 */
export type AdapterSchemaCreation = {
	/**
	 * Code to be inserted into the file
	 *
	 * This is typically database schema definitions or migrations.
	 */
	code: string;

	/**
	 * Path to the file, including the file name and extension
	 *
	 * Relative paths are supported, with the current working directory
	 * of the developer's project as the base.
	 */
	path: string;

	/**
	 * Append the file if it already exists
	 *
	 * Note: This will not apply if `overwrite` is set to true.
	 *
	 * @default false
	 */
	append?: boolean;

	/**
	 * Overwrite the file if it already exists
	 *
	 * @default false
	 */
	overwrite?: boolean;
};

/**
 * Type definition for an adapter factory function
 *
 * This type represents a function that creates and returns an adapter instance
 * configured with the provided options.
 */
export type AdapterInstance = (options: C15TOptions) => Adapter;
