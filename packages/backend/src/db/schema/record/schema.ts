import { z } from 'zod';

/**
 * Zod schema for validating consent record entities.
 *
 * This defines the structure and validation rules for consent records:
 * - Required fields: userId, actionType (given, withdrawn, updated, etc.)
 * - Optional fields: consentId, details
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const recordData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: 'user-123',
 *   consentId: 'consent-456',
 *   actionType: 'given',
 *   details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
 * };
 *
 * // Validate and parse the record data
 * const validRecord = recordSchema.parse(recordData);
 * ```
 */
export const recordSchema = z.object({
	id: z.string(),
	userId: z.string(),
	consentId: z.string().optional(),
	actionType: z.string(),
	details: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for Record
 *
 * This type represents the structure of a consent record
 * as defined by the recordSchema. It includes all fields
 * that are part of the consent record entity.
 */
export type inferRecord = z.infer<typeof recordSchema>;
