/**
 * Migration system for c15t
 *
 * This module provides functionality to generate and execute database migrations
 * based on schema definitions.
 *
 * this is inspired by better-auth migration system
 *
 * @module migration
 */
export { getMigrations } from './get-migration';
export type {
	MigrationResult,
	MigrationOperation,
	ColumnsToAdd,
	TableToCreate,
} from './types';
