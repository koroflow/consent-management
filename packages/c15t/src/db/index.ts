// packages/c15t/src/db/index.ts

/**
 * Database Module - Main Entry Point
 *
 * This module provides a type-safe interface for interacting with the database.
 */

// Schema-related exports
export {
	getConsentTables,
	parseInputData,
	parseOutputData,
	getAllFields,
} from './schema/index';

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
