import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating domain entities.
 *
 * This defines the structure and validation rules for domain records:
 * - Required fields: name
 * - Optional fields: description, allowedOrigins
 * - Default value of true for isActive and isVerified
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const domainData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'example.com',
 *   description: 'Company website',
 *   allowedOrigins: ['https://app.example.com', 'https://admin.example.com']
 * };
 *
 * // Validate and parse the domain data
 * const validDomain = domainSchema.parse(domainData);
 * ```
 */
export const domainSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	description: z.string().optional(),
	allowedOrigins: z.array(z.string()).optional().default([]),
	isVerified: z.boolean().default(true),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().optional(),
});

/**
 * Processes domain data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param domain - The raw domain data from the database
 * @returns Processed domain data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawDomain = await adapter.findOne({ model: 'domain', where: [...] });
 * const processedDomain = parseDomainOutput(options, rawDomain);
 * // processedDomain will have any restricted fields removed based on configuration
 * ```
 */
export function parseDomainOutput(
	options: C15TOptions,
	domain: z.infer<typeof domainSchema>
) {
	const schema = getAllFields(options, 'domain');
	return parseOutputData(domain, { fields: schema });
}

/**
 * Processes input data for domain creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param domain - The input domain data to be processed
 * @param action - Whether this is for creating a new domain or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for domain creation
 *
 * @example
 * ```typescript
 * // For creating a new domain
 * const validDomainData = parseDomainInput(options, inputData, 'create');
 *
 * // For updating an existing domain
 * const validUpdateData = parseDomainInput(options, partialData, 'update');
 * ```
 */
export function parseDomainInput(
	options: C15TOptions,
	domain?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'domain');
	return parseInputData(domain || {}, { fields: schema, action });
}

/**
 * Type definition for Domain
 *
 * This type represents the structure of a domain record
 * as defined by the domainSchema. It includes all fields
 * that are part of the domain entity.
 */
export type Domain = z.infer<typeof domainSchema>;
