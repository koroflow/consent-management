import { z } from 'zod';

/**
 * Zod schema for validating user entities.
 *
 * This defines the structure and validation rules for user records:
 * - Requires a valid UUID for the ID field
 * - Default value of false for isIdentified
 * - Optional fields for externalId, identityProvider, and lastIpAddress
 * - Default current date/time for creation and update timestamps
 *
 * @example
 * ```typescript
 * const userData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   externalId: 'ext-123',
 *   isIdentified: true
 * };
 *
 * // Validate and parse the user data
 * const validUser = userSchema.parse(userData);
 * ```
 */
export const userSchema = z.object({
	id: z.string(),
	isIdentified: z.boolean().default(false),
	externalId: z.string().optional(),
	identityProvider: z.string().optional(),
	lastIpAddress: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Type definition for User
 *
 * This type represents the structure of a user record
 * as defined by the userSchema. It includes all fields
 * that are part of the user entity.
 */
export type User = z.infer<typeof userSchema>;
