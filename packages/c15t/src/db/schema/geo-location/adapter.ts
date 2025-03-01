import type { GenericEndpointContext, Where } from '~/types';
import { type GeoLocation, parseGeoLocationOutput } from './schema';
import { getWithHooks } from '~/db/hooks/with-hooks-factory';
import type { InternalAdapterContext } from '~/db/internal-adapter';

/**
 * Creates and returns a set of geo-location-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating and finding
 * geo-location records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param createWithHooks - Function to create records with before/after hooks
 * @param options - Configuration options for the C15T system
 * @returns An object containing type-safe geo-location operations
 *
 * @example
 * ```typescript
 * const locationAdapter = createGeoLocationAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new geo-location record
 * const location = await locationAdapter.createGeoLocation({
 *   countryCode: 'US',
 *   countryName: 'United States',
 *   regionCode: 'CA',
 *   regionName: 'California',
 *   regulatoryZones: ['CCPA', 'CPRA']
 * });
 * ```
 */
export function createGeoLocationAdapter({
	adapter,
	ctx,
}: InternalAdapterContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);
	return {
		/**
		 * Creates a new geo-location record in the database.
		 * Automatically sets creation timestamp and applies any
		 * configured hooks during the creation process.
		 *
		 * @param location - Geo-location data to create (without id and timestamp)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created geo-location record with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createGeoLocation: async (
			location: Omit<GeoLocation, 'id' | 'createdAt'> & Partial<GeoLocation>,
			context?: GenericEndpointContext
		) => {
			const createdLocation = await createWithHooks(
				{
					createdAt: new Date(),
					...location,
				},
				'geoLocation',
				undefined,
				context
			);

			if (!createdLocation) {
				throw new Error(
					'Failed to create geo-location - operation returned null'
				);
			}

			return createdLocation as GeoLocation;
		},

		/**
		 * Finds all geo-location records matching the given criteria.
		 * Returns geo-locations with processed output fields according to the schema configuration.
		 *
		 * @param filter - Optional filter parameters for the query
		 * @returns Array of geo-location records matching the criteria
		 */
		findGeoLocations: async (filter?: {
			countryCode?: string;
			regionCode?: string;
		}) => {
			const whereConditions: Where[] = [];

			if (filter?.countryCode) {
				whereConditions.push({
					field: 'countryCode',
					value: filter.countryCode,
				});
			}

			if (filter?.regionCode) {
				whereConditions.push({
					field: 'regionCode',
					value: filter.regionCode,
				});
			}

			const locations = await adapter.findMany<GeoLocation>({
				model: 'geoLocation',
				where: whereConditions,
				sortBy: {
					field: 'countryName',
					direction: 'asc',
				},
			});

			return locations.map((location) =>
				parseGeoLocationOutput(ctx.options, location)
			);
		},

		/**
		 * Finds a geo-location record by its unique ID.
		 * Returns the geo-location with processed output fields according to the schema configuration.
		 *
		 * @param locationId - The unique identifier of the geo-location record
		 * @returns The geo-location object if found, null otherwise
		 */
		findGeoLocationById: async (locationId: string) => {
			const location = await adapter.findOne<GeoLocation>({
				model: 'geoLocation',
				where: [
					{
						field: 'id',
						value: locationId,
					},
				],
			});
			return location ? parseGeoLocationOutput(ctx.options, location) : null;
		},

		/**
		 * Finds geo-location records by country code.
		 * Returns geo-locations with processed output fields according to the schema configuration.
		 *
		 * @param countryCode - The country code to search for
		 * @returns Array of geo-location records for the specified country
		 */
		findGeoLocationsByCountry: async (countryCode: string) => {
			const locations = await adapter.findMany<GeoLocation>({
				model: 'geoLocation',
				where: [
					{
						field: 'countryCode',
						value: countryCode,
					},
				],
				sortBy: {
					field: 'regionName',
					direction: 'asc',
				},
			});

			return locations.map((location) =>
				parseGeoLocationOutput(ctx.options, location)
			);
		},
	};
}
