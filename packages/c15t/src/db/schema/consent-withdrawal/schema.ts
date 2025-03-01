import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating consent withdrawal entities.
 *
 * This defines the structure and validation rules for withdrawal records:
 * - Required fields: consentId, userId
 * - Optional fields: withdrawalReason, withdrawalMethod, ipAddress, metadata
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const withdrawalData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   consentId: 'consent-123',
 *   userId: 'user-456',
 *   withdrawalReason: 'No longer wish to receive marketing emails',
 *   withdrawalMethod: 'user-initiated',
 *   ipAddress: '192.168.1.1'
 * };
 *
 * // Validate and parse the withdrawal data
 * const validWithdrawal = consentWithdrawalSchema.parse(withdrawalData);
 * ```
 */
export const consentWithdrawalSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	userId: z.string(),
	withdrawalReason: z.string().optional(),
	withdrawalMethod: z
		.enum(['user-initiated', 'automatic-expiry', 'admin', 'api', 'other'])
		.default('user-initiated'),
	ipAddress: z.string().optional(),
	userAgent: z.string().optional(),
	metadata: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for ConsentWithdrawal
 *
 * This type represents the structure of a consent withdrawal record
 * as defined by the consentWithdrawalSchema. It includes all fields
 * that are part of the withdrawal entity.
 */
export type ConsentWithdrawal = z.infer<typeof consentWithdrawalSchema>;

/**
 * Processes consent withdrawal data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param withdrawal - The raw withdrawal data from the database
 * @returns Processed withdrawal data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawWithdrawal = await adapter.findOne({ model: 'consentWithdrawal', where: [...] });
 * const processedWithdrawal = parseConsentWithdrawalOutput(options, rawWithdrawal);
 * ```
 */
export function parseConsentWithdrawalOutput(
	options: C15TOptions,
	withdrawal: ConsentWithdrawal
) {
	const schema = getAllFields(options, 'consentWithdrawal');
	return parseOutputData(withdrawal, { fields: schema });
}

/**
 * Processes input data for consent withdrawal creation.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param withdrawal - The input withdrawal data to be processed
 * @param action - Whether this is for creating a new withdrawal or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for withdrawal creation
 *
 * @example
 * ```typescript
 * // For creating a new withdrawal record
 * const validWithdrawalData = parseConsentWithdrawalInput(options, inputData, 'create');
 * ```
 */
export function parseConsentWithdrawalInput(
	options: C15TOptions,
	withdrawal?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentWithdrawal');
	return parseInputData(withdrawal || {}, { fields: schema, action });
}
