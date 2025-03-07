import type { z } from 'zod';
import {
	auditLogSchema,
	consentGeoLocationSchema,
	consentPolicySchema,
	consentSchema,
	domainSchema,
	geoLocationSchema,
	purposeJunctionSchema,
	purposeSchema,
	consentRecordSchema,
	subjectSchema,
	withdrawalSchema,
} from './index';

// Export all schemas
export const schemas = {
	subject: subjectSchema,
	purpose: purposeSchema,
	consentPolicy: consentPolicySchema,
	domain: domainSchema,
	consent: consentSchema,
	purposeJunction: purposeJunctionSchema,
	record: consentRecordSchema,
	consentGeoLocation: consentGeoLocationSchema,
	geoLocation: geoLocationSchema,
	withdrawal: withdrawalSchema,
	auditLog: auditLogSchema,
} as const;

// Type for all table names
export type TableName = keyof typeof schemas;

// Type for inferring the shape of any table
export type InferTableShape<T extends TableName> = z.infer<(typeof schemas)[T]>;
