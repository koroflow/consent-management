import { z } from 'zod';

/**
 * Zod schema for validating consent purpose entities.
 *
 * This defines the structure and validation rules for consent purpose records:
 * - Required fields: code, name, description
 * - Default value of false for isEssential
 * - Default value of true for isActive
 * - Optional fields for dataCategory and legalBasis
 * - Default current date/time for creation and update timestamps
 *
 * @example
 * ```typescript
 * const purposeData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   code: 'marketing',
 *   name: 'Marketing Communications',
 *   description: 'Allow us to send you marketing materials',
 *   isEssential: false
 * };
 *
 * // Validate and parse the purpose data
 * const validPurpose = purposeSchema.parse(purposeData);
 *
 * // Example with missing fields (defaults will be applied)
 * const minimalPurposeData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   code: 'marketing',
 *   name: 'Marketing Communications',
 *   description: 'Allow us to send you marketing materials',
 * };
 *
 * // isEssential will default to false, isActive to true, etc.
 * const purposeWithDefaults = purposeSchema.parse(minimalPurposeData);
 * ```
 */
export const purposeSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	description: z.string(),
	isEssential: z.boolean().default(false),
	dataCategory: z.string().optional(),
	legalBasis: z.string().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Type definition for Purpose
 *
 * This type represents the structure of a consent purpose record
 * as defined by the purposeSchema. It includes all fields
 * that are part of the consent purpose entity.
 */
export type Purpose = z.infer<typeof purposeSchema>;
