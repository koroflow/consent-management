/**
 * Schema Module
 *
 * This module handles the generation and processing of database schemas
 * based on the C15T configuration. It transforms table definitions into
 * a structured schema representation that can be used for database operations.
 *
 * @module schema
 *
 * Example usage:
 * ```typescript
 * import { getSchema } from '~/db/migration/get-schema';
 * import type { SchemaDefinition } from '~/db/migration/get-schema';
 *
 * // Get schema based on configuration
 * const schema: SchemaDefinition = getSchema(config);
 * ```
 */
export { getSchema } from './get-schema';
export type { SchemaDefinition, TableSchemaDefinition } from './types';
