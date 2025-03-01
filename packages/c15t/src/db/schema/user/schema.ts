import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';

import type { C15TOptions } from '~/types';

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
	id: z.string().uuid(),
	isIdentified: z.boolean().default(false),
	externalId: z.string().optional(),
	identityProvider: z.string().optional(),
	lastIpAddress: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

/**
 * Processes user data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param user - The raw user data from the database
 * @returns Processed user data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawUser = await adapter.findOne({ model: 'user', where: [...] });
 * const processedUser = parseUserOutput(options, rawUser);
 * // processedUser will have sensitive fields removed based on configuration
 * ```
 */
export function parseUserOutput(
	options: C15TOptions,
	user: z.infer<typeof userSchema>
) {
	const schema = getAllFields(options, 'user');
	return parseOutputData(user, { fields: schema });
}

/**
 * Processes input data for user creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param user - The input user data to be processed
 * @param action - Whether this is for creating a new user or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for user creation
 *
 * @example
 * ```typescript
 * // For creating a new user
 * const validUserData = parseUserInput(options, inputData, 'create');
 *
 * // For updating an existing user
 * const validUpdateData = parseUserInput(options, partialData, 'update');
 * ```
 */
export function parseUserInput(
	options: C15TOptions,
	user?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'user');
	return parseInputData(user || {}, { fields: schema, action });
}

/**
 * Type definition for User
 *
 * This type represents the structure of a user record
 * as defined by the userSchema. It includes all fields
 * that are part of the user entity.
 */
export type User = z.infer<typeof userSchema>;
