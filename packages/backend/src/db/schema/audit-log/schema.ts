import { z } from 'zod';

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
