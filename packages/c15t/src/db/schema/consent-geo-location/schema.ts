import { z } from 'zod';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';
import type { C15TOptions } from '~/types';

/**
 * Zod schema for validating consent geo-location entities.
 *
 * This defines the structure and validation rules for geo-location records:
 * - Required fields: consentId, ip (IP address)
 * - Optional fields: country, region, city, latitude, longitude, timezone
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const geoLocationData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   consentId: '234e5678-e89b-12d3-a456-426614174000',
 *   ip: '192.168.1.1',
 *   country: 'US',
 *   city: 'New York',
 *   latitude: 40.7128,
 *   longitude: -74.0060
 * };
 *
 * // Validate and parse the geo-location data
 * const validGeoLocation = consentGeoLocationSchema.parse(geoLocationData);
 * ```
 */
export const consentGeoLocationSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	ip: z.string(),
	country: z.string().optional(),
	region: z.string().optional(),
	city: z.string().optional(),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	timezone: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Processes consent geo-location data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param geoLocation - The raw geo-location data from the database
 * @returns Processed geo-location data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawGeoLocation = await adapter.findOne({ model: 'consentGeoLocation', where: [...] });
 * const processedGeoLocation = parseConsentGeoLocationOutput(options, rawGeoLocation);
 * ```
 */
export function parseConsentGeoLocationOutput(
	options: C15TOptions,
	geoLocation: ConsentGeoLocation
) {
	const schema = getAllFields(options, 'consentGeoLocation');
	return parseOutputData(geoLocation, { fields: schema });
}

/**
 * Processes input data for consent geo-location creation.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param geoLocation - The input geo-location data to be processed
 * @param action - Whether this is for creating a new geo-location or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for geo-location creation
 *
 * @example
 * ```typescript
 * // For creating a new geo-location record
 * const validGeoLocationData = parseConsentGeoLocationInput(options, inputData, 'create');
 * ```
 */
export function parseConsentGeoLocationInput(
	options: C15TOptions,
	geoLocation?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentGeoLocation');
	return parseInputData(geoLocation || {}, { fields: schema, action });
}

/**
 * Type definition for ConsentGeoLocation
 *
 * This type represents the structure of a consent geo-location record
 * as defined by the consentGeoLocationSchema. It includes all fields
 * that are part of the consent geo-location entity.
 */
export type ConsentGeoLocation = z.infer<typeof consentGeoLocationSchema>;
