import { z } from 'zod';

/**
 * Zod schema for validating consent entities.
 *
 * This defines the structure and validation rules for consent records:
 * - Required fields: userId, domainId, purposeIds
 * - Default value of 'active' for status
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const consentData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: 'user-123',
 *   domainId: 'domain-456',
 *   purposeIds: ['purpose-789'],
 *   status: 'active'
 * };
 *
 * // Validate and parse the consent data
 * const validConsent = consentSchema.parse(consentData);
 * ```
 */
export const consentSchema = z.object({
	id: z.string(),
	userId: z.string(),
	domainId: z.string(),
	purposeIds: z.array(z.string()),
	policyId: z.string().optional(),
	status: z.enum(['active', 'expired', 'withdrawn']).default('active'),
	withdrawalReason: z.string().optional(),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
	givenAt: z.date().default(() => new Date()),
	updatedAt: z.date().optional(),
	validUntil: z.date().optional(),
});

/**
 * Type definition for Consent
 *
 * This type represents the structure of a consent record
 * as defined by the consentSchema. It includes all fields
 * that are part of the consent entity.
 */
export type Consent = z.infer<typeof consentSchema>;
