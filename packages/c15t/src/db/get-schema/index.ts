/**
 * Schema Module
 *
 * This module handles the generation and processing of database schemas
 * based on the C15T configuration. It transforms table definitions into
 * a structured schema representation that can be used for database operations.
 *
 * @module schema
 */
export { getSchema } from './get-schema';
export type { SchemaDefinition, TableSchemaDefinition } from './types';
