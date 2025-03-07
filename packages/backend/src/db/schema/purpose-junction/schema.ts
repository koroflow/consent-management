import { z } from 'zod';

/**
 * Zod schema for validating consent-purpose junction entities.
 *
 * This defines the structure and validation rules for junction records:
 * - Required fields: consentId, purposeId
 * - Default value of 'active' for status
 * - Default current date/time for creation and update timestamps
 * - Default current date/time for update timestamp
 *
 * @example
 * ```typescript
 * const junctionData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   consentId: 'consent-123',
 *   purposeId: 'purpose-456',
 *   status: 'active'
 * };
 *
 * // Validate and parse the junction data
 * const validJunction = purposeJunctionSchema.parse(junctionData);
 * ```
 */
export const purposeJunctionSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	purposeId: z.string(),
	status: z
		.enum(['active', 'withdrawn'], {
			errorMap: () => ({
				message: "Status must be either 'active' or 'withdrawn'",
			}),
		})
		.default('active'),

	metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Type definition for PurposeJunction
 *
 * This type represents the structure of a consent-purpose junction record
 * as defined by the purposeJunctionSchema. It includes all fields
 * that are part of the junction entity.
 */
export type PurposeJunction = z.infer<typeof purposeJunctionSchema>;
