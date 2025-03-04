import type { C15TDBSchema } from '../schema/definition';
import type { Field } from './fields';

/**
 * Plugin-provided schema type with proper typing.
 * Defines the structure of schemas that plugins can provide to extend the system.
 *
 * @template TEntityKey - The entity key in the schema
 */
export type PluginSchema = Record<
	string,
	{
		fields: Record<string, Field>;
		entityName?: string;
	}
>;

/**
 * Maps entity keys to their corresponding data structures.
 * Provides type access to all entities defined in the database schema.
 *
 * @template TKey - Entity key in the database schema
 */
export type EntityTypeMap = {
	[TKey in keyof C15TDBSchema]: C15TDBSchema[TKey];
};

/**
 * All valid entity names in the database schema.
 * This type represents the keys of all entities that can be used in queries.
 */
export type EntityName = keyof C15TDBSchema;

/**
 * Input type for entity operations, allowing partial fields and additional properties.
 * Used when creating or updating entity records.
 *
 * @template TEntity - The entity type being operated on
 *
 * @example
 * ```typescript
 * // Define input for creating a user
 * const userInput: EntityInput<'user'> = {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * };
 * ```
 */
export type EntityInput<TEntity extends EntityName> = Partial<
	EntityTypeMap[TEntity]
> &
	Record<string, unknown>;

/**
 * Output type for entity operations returned from the database.
 * Represents the full structure of an entity as returned from queries.
 *
 * @template TEntity - The entity type being returned
 *
 * @example
 * ```typescript
 * // Type for a user retrieved from the database
 * const user: EntityOutput<'user'> = {
 *   id: '123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   createdAt: new Date()
 * };
 * ```
 */
export type EntityOutput<TEntity extends EntityName> = EntityTypeMap[TEntity] &
	Record<string, unknown>;
