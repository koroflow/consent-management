import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating consent record entities.
 *
 * This defines the structure and validation rules for consent records:
 * - Required fields: userId, actionType (given, withdrawn, updated, etc.)
 * - Optional fields: consentId, details
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const recordData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: 'user-123',
 *   consentId: 'consent-456',
 *   actionType: 'given',
 *   details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
 * };
 *
 * // Validate and parse the record data
 * const validRecord = recordSchema.parse(recordData);
 * ```
 */
export const recordSchema = z.object({
	id: z.string(),
	userId: z.string(),
	consentId: z.string().optional(),
	actionType: z.string(),
	details: z.record(z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for Record
 *
 * This type represents the structure of a consent record
 * as defined by the recordSchema. It includes all fields
 * that are part of the consent record entity.
 */
export type Record = z.infer<typeof recordSchema>;

/**
 * Processes consent record data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param record - The raw consent record data from the database
 * @returns Processed consent record data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawRecord = await adapter.findOne({ model: 'record', where: [...] });
 * const processedRecord = parseRecordOutput(options, rawRecord);
 * ```
 */
export function parseRecordOutput(options: C15TOptions, record: Record) {
	const schema = getAllFields(options, 'record');
	return parseOutputData(record, { fields: schema });
}

/**
 * Processes input data for consent record creation.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param record - The input consent record data to be processed
 * @param action - Whether this is for creating a new record or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for record creation
 *
 * @example
 * ```typescript
 * // For creating a new consent record
 * const validRecordData = parseRecordInput(options, inputData, 'create');
 * ```
 */
export function parseRecordInput(
	options: C15TOptions,
	record?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'record');
	return parseInputData(record || {}, { fields: schema, action });
}

export const recordTypeEnum = z.enum([
	'form_submission',
	'api_call',
	'banner_interaction',
	'preference_center',
	'verbal_consent',
	'offline_consent',
	'partner_consent',
	'implied_consent',
	'consent_migration',
	'withdrawal',
	'other',
]);
