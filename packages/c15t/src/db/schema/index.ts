/**
 * Schema Module
 *
 * Contains the table definitions, data parsing, and schema utilities.
 */

// Re-export existing table definitions
export * from './audit-log';
export * from './consent';
export * from './consent-geo-location';
export * from './geo-location';
export * from './consent-policy';
export * from './domain';
export * from './purpose';
export * from './purpose-junction';
export * from './record';
export * from './user';
export * from './withdrawal';

// New organized exports
export { getConsentTables, type C15TDBSchema } from './definition';
export {
	parseInputData,
	parseOutputData,
	getAllFields,
	mergeSchema,
} from './parser';
