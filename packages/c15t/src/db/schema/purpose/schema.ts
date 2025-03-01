import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';
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
 * Processes consent purpose data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param purpose - The raw purpose data from the database
 * @returns Processed purpose data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawPurpose = await adapter.findOne({ model: 'purpose', where: [...] });
 * const processedPurpose = parsePurposeOutput(options, rawPurpose);
 * // processedPurpose will have any restricted fields removed based on configuration
 * ```
 */
export function parsePurposeOutput(
	options: C15TOptions,
	purpose: z.infer<typeof purposeSchema>
) {
	const schema = getAllFields(options, 'purpose');
	return parseOutputData(purpose, { fields: schema });
}

/**
 * Processes input data for consent purpose creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param purpose - The input purpose data to be processed
 * @param action - Whether this is for creating a new purpose or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for purpose creation
 *
 * @example
 * ```typescript
 * // For creating a new purpose
 * const validPurposeData = parsePurposeInput(options, inputData, 'create');
 *
 * // For updating an existing purpose
 * const validUpdateData = parsePurposeInput(options, partialData, 'update');
 * ```
 */
export function parsePurposeInput(
	options: C15TOptions,
	purpose?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'purpose');
	return parseInputData(purpose || {}, { fields: schema, action });
}

/**
 * Type definition for Purpose
 *
 * This type represents the structure of a consent purpose record
 * as defined by the purposeSchema. It includes all fields
 * that are part of the consent purpose entity.
 */
export type Purpose = z.infer<typeof purposeSchema>;
