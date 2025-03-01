import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating consent-purpose junction entities.
 *
 * This defines the structure and validation rules for junction records:
 * - Required fields: consentId, purposeId
 * - Default value of 'active' for status
 * - Default current date/time for creation timestamp
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
 * const validJunction = consentPurposeJunctionSchema.parse(junctionData);
 * ```
 */
export const consentPurposeJunctionSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	purposeId: z.string(),
	status: z.enum(['active', 'withdrawn']).default('active'),
	metadata: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().optional(),
});

/**
 * Type definition for ConsentPurposeJunction
 *
 * This type represents the structure of a consent-purpose junction record
 * as defined by the consentPurposeJunctionSchema. It includes all fields
 * that are part of the junction entity.
 */
export type ConsentPurposeJunction = z.infer<
	typeof consentPurposeJunctionSchema
>;

/**
 * Processes consent-purpose junction data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param junction - The raw junction data from the database
 * @returns Processed junction data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawJunction = await adapter.findOne({ model: 'consentPurposeJunction', where: [...] });
 * const processedJunction = parseConsentPurposeJunctionOutput(options, rawJunction);
 * ```
 */
export function parseConsentPurposeJunctionOutput(
	options: C15TOptions,
	junction: ConsentPurposeJunction
) {
	const schema = getAllFields(options, 'consentPurposeJunction');
	return parseOutputData(junction, { fields: schema });
}

/**
 * Processes input data for consent-purpose junction creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param junction - The input junction data to be processed
 * @param action - Whether this is for creating a new junction or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for junction creation
 *
 * @example
 * ```typescript
 * // For creating a new junction
 * const validJunctionData = parseConsentPurposeJunctionInput(options, inputData, 'create');
 *
 * // For updating an existing junction
 * const validUpdateData = parseConsentPurposeJunctionInput(options, partialData, 'update');
 * ```
 */
export function parseConsentPurposeJunctionInput(
	options: C15TOptions,
	junction?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentPurposeJunction');
	return parseInputData(junction || {}, { fields: schema, action });
}
