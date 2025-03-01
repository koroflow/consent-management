import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

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
 * Processes consent policy data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param policy - The raw policy data from the database
 * @returns Processed policy data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawPolicy = await adapter.findOne({ model: 'consentPolicy', where: [...] });
 * const processedPolicy = parseConsentPolicyOutput(options, rawPolicy);
 * // processedPolicy will have any restricted fields removed based on configuration
 * ```
 */
export function parseConsentPolicyOutput(
	options: C15TOptions,
	policy: ConsentPolicy
) {
	const schema = getAllFields(options, 'consentPolicy');
	return parseOutputData(policy, { fields: schema });
}

/**
 * Processes input data for consent policy creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param policy - The input policy data to be processed
 * @param action - Whether this is for creating a new policy or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for policy creation
 *
 * @example
 * ```typescript
 * // For creating a new policy
 * const validPolicyData = parseConsentPolicyInput(options, inputData, 'create');
 *
 * // For updating an existing policy
 * const validUpdateData = parseConsentPolicyInput(options, partialData, 'update');
 * ```
 */
export function parseConsentPolicyInput(
	options: C15TOptions,
	policy?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentPolicy');
	return parseInputData(policy || {}, { fields: schema, action });
}

/**
 * Type definition for ConsentPolicy
 *
 * This type represents the structure of a consent policy record
 * as defined by the consentPolicySchema. It includes all fields
 * that are part of the consent policy entity.
 */
export type ConsentPolicy = z.infer<typeof consentPolicySchema>;
