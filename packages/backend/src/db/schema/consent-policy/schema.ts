import { z } from 'zod';

/**
 * Zod schema for validating consent policy entities.
 *
 * This defines the structure and validation rules for consent policy records:
 * - Required fields: version, name, effectiveDate, content, contentHash
 * - Optional fields: expirationDate
 * - Default value of true for isActive
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const policyData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   version: '1.0.0',
 *   name: 'Privacy Policy 2023',
 *   effectiveDate: new Date(),
 *   content: 'Full policy text...',
 *   contentHash: 'sha256-hash-of-content'
 * };
 *
 * // Validate and parse the policy data
 * const validPolicy = consentPolicySchema.parse(policyData);
 * ```
 */
export const consentPolicySchema = z.object({
	id: z.string(),
	version: z.string(),
	name: z.string(),
	effectiveDate: z.date(),
	expirationDate: z.date().optional(),
	content: z.string(),
	contentHash: z.string(),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for ConsentPolicy
 *
 * This type represents the structure of a consent policy record
 * as defined by the consentPolicySchema. It includes all fields
 * that are part of the consent policy entity.
 */
export type ConsentPolicy = z.infer<typeof consentPolicySchema>;
