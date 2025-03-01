import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating consent audit log entities.
 *
 * This defines the structure and validation rules for audit log entries:
 * - Required fields: entityType, entityId, actionType
 * - Optional fields: userId, ipAddress, changes, metadata
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const auditLogData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   entityType: 'consent',
 *   entityId: 'consent-123',
 *   actionType: 'update',
 *   userId: 'admin-456',
 *   changes: { status: { from: 'active', to: 'withdrawn' } }
 * };
 *
 * // Validate and parse the audit log data
 * const validAuditLog = auditLogSchema.parse(auditLogData);
 * ```
 */
export const auditLogSchema = z.object({
	id: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	actionType: z.string(),
	userId: z.string().optional(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	changes: z.record(z.unknown()).optional(),
	metadata: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for AuditLog
 *
 * This type represents the structure of a consent audit log entry
 * as defined by the auditLogSchema. It includes all fields
 * that are part of the audit log entity.
 */
export type AuditLog = z.infer<typeof auditLogSchema>;

/**
 * Processes consent audit log data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param auditLog - The raw audit log data from the database
 * @returns Processed audit log data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawLog = await adapter.findOne({ model: 'auditLog', where: [...] });
 * const processedLog = parseAuditLogOutput(options, rawLog);
 * ```
 */
export function parseAuditLogOutput(options: C15TOptions, auditLog: AuditLog) {
	const schema = getAllFields(options, 'auditLog');
	return parseOutputData(auditLog, { fields: schema });
}

/**
 * Processes input data for consent audit log creation.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param auditLog - The input audit log data to be processed
 * @param action - Whether this is for creating a new log entry or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for log creation
 *
 * @example
 * ```typescript
 * // For creating a new audit log entry
 * const validLogData = parseAuditLogInput(options, inputData, 'create');
 * ```
 */
export function parseAuditLogInput(
	options: C15TOptions,
	auditLog?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'auditLog');
	return parseInputData(auditLog || {}, { fields: schema, action });
}
