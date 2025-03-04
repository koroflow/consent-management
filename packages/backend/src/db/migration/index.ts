/**
 * Migration system for c15t
 *
 * This module provides functionality to generate and execute database migrations
 * based on schema definitions.
 *
 * This is inspired by the better-auth migration system
 * (https://github.com/betterauth/better-auth or relevant link)
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
