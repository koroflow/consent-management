import { z } from 'zod';

/**
 * Zod schema for validating consent withdrawal entities.
 *
 * This defines the structure and validation rules for withdrawal records:
 * - Required fields: consentId, subjectId
 * - Optional fields: withdrawalReason, withdrawalMethod, ipAddress, metadata
 * - Default current date/time for creation and update timestamps
 *
 * @example
 * ```typescript
 * const withdrawalData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   consentId: 'consent-123',
 *   subjectId: 'subject-456',
 *   withdrawalReason: 'No longer wish to receive marketing emails',
 *   withdrawalMethod: 'subject-initiated',
 *   ipAddress: '192.168.1.1'
 * };
 *
 * // Validate and parse the withdrawal data
 * const validWithdrawal = withdrawalSchema.parse(withdrawalData);
 * ```
 */
export const withdrawalSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	subjectId: z.string(),
	withdrawalReason: z.string().optional(),
	withdrawalMethod: z
		.enum(['subject-initiated', 'automatic-expiry', 'admin', 'api', 'other'])
		.default('subject-initiated'),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Type definition for Withdrawal
 *
 * This type represents the structure of a consent withdrawal record
 * as defined by the withdrawalSchema. It includes all fields
 * that are part of the withdrawal entity.
 */
export type Withdrawal = z.infer<typeof withdrawalSchema>;
