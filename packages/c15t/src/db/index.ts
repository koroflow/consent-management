// packages/c15t/src/db/index.ts

/**
 * Database Module - Main Entry Point
 *
 * This module provides a type-safe interface for interacting with the database.
 */

export type {
	Database,
	Table,
	TableInput,
	TableOutput,
	RequiredTables,
	RequiredCoreTables,
	OptionalPluginTables,
} from './types';

// Schema-related exports
export {
	getConsentTables,
	parseInputData,
	parseOutputData,
	getAllFields,
} from './schema/index';

export type {
	ModelName,
	ModelTypeMap,
	CoreTableName,
	PluginTableName,
} from './schema/index';

// Utility functions
export { isCoreTable } from './utils/index';

// Field-related exports
export type {
	FieldAttribute,
	FieldType,
} from './core/fields';

export {
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
} from './core/fields';
