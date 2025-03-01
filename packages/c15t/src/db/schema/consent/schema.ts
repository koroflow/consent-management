import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

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
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().optional(),
	expiresAt: z.date().optional(),
});

/**
 * Type definition for Consent
 *
 * This type represents the structure of a consent record
 * as defined by the consentSchema. It includes all fields
 * that are part of the consent entity.
 */
export type Consent = z.infer<typeof consentSchema>;

/**
 * Processes consent data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param consent - The raw consent data from the database
 * @returns Processed consent data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawConsent = await adapter.findOne({ model: 'consent', where: [...] });
 * const processedConsent = parseConsentOutput(options, rawConsent);
 * // processedConsent will have any restricted fields removed based on configuration
 * ```
 */
export function parseConsentOutput(options: C15TOptions, consent: Consent) {
	const schema = getAllFields(options, 'consent');
	return parseOutputData(consent, { fields: schema });
}

/**
 * Processes input data for consent creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param consent - The input consent data to be processed
 * @param action - Whether this is for creating a new consent or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for consent creation
 *
 * @example
 * ```typescript
 * // For creating a new consent
 * const validConsentData = parseConsentInput(options, inputData, 'create');
 *
 * // For updating an existing consent
 * const validUpdateData = parseConsentInput(options, partialData, 'update');
 * ```
 */
export function parseConsentInput(
	options: C15TOptions,
	consent?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consent');
	return parseInputData(consent || {}, { fields: schema, action });
}
