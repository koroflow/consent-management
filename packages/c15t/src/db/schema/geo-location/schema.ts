import { z } from 'zod';
import type { C15TOptions } from '~/types';
import { getAllFields, parseInputData, parseOutputData } from '~/db/schema';

/**
 * Zod schema for validating geo-location entities.
 *
 * This defines the structure and validation rules for geographic location records:
 * - Required fields: countryCode, countryName
 * - Optional fields: regionCode, regionName, regulatoryZones
 * - Default current date/time for creation timestamp
 *
 * @example
 * ```typescript
 * const locationData = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   countryCode: 'US',
 *   countryName: 'United States',
 *   regionCode: 'CA',
 *   regionName: 'California',
 *   regulatoryZones: ['CCPA', 'CPRA']
 * };
 *
 * // Validate and parse the geo-location data
 * const validLocation = geoLocationSchema.parse(locationData);
 * ```
 */
export const geoLocationSchema = z.object({
	id: z.string(),
	countryCode: z.string(),
	countryName: z.string(),
	regionCode: z.string().optional(),
	regionName: z.string().optional(),
	regulatoryZones: z.array(z.string()).optional(),
	createdAt: z.date().default(() => new Date()),
});

/**
 * Type definition for GeoLocation
 *
 * This type represents the structure of a geo-location entity
 * as defined by the geoLocationSchema. It includes all fields
 * that are part of the geo-location entity.
 */
export type GeoLocation = z.infer<typeof geoLocationSchema>;

/**
 * Processes geo-location data from the database for client-side consumption.
 *
 * Applies output transformations, filters out fields that shouldn't be returned,
 * and ensures the response conforms to configured schema rules.
 *
 * @param options - The C15T configuration options
 * @param location - The raw geo-location data from the database
 * @returns Processed geo-location data safe for client consumption
 *
 * @example
 * ```typescript
 * const rawLocation = await adapter.findOne({ model: 'geoLocation', where: [...] });
 * const processedLocation = parseGeoLocationOutput(options, rawLocation);
 * ```
 */
export function parseGeoLocationOutput(
	options: C15TOptions,
	location: GeoLocation
) {
	const schema = getAllFields(options, 'geoLocation');
	return parseOutputData(location, { fields: schema });
}

/**
 * Processes input data for geo-location creation or updates.
 *
 * Applies input validations, transforms input values, sets default values,
 * and enforces required fields based on the action type (create/update).
 *
 * @param options - The C15T configuration options
 * @param location - The input geo-location data to be processed
 * @param action - Whether this is for creating a new geo-location or updating an existing one
 * @returns Processed input data ready for database operations
 *
 * @throws {APIError} If required fields are missing for geo-location creation
 *
 * @example
 * ```typescript
 * // For creating a new geo-location record
 * const validLocationData = parseGeoLocationInput(options, inputData, 'create');
 * ```
 */
export function parseGeoLocationInput(
	options: C15TOptions,
	location?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'geoLocation');
	return parseInputData(location || {}, { fields: schema, action });
}
