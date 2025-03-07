import type { Where } from '~/db/adapters/types';
import { getWithHooks } from '~/db/hooks';
import type { GenericEndpointContext, RegistryContext } from '~/types';
import { validateEntityOutput } from '../definition';
import type { inferRecord as Record } from './schema';

/**
 * Creates and returns a set of consent record-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating and querying consent records
 * while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe consent record operations
 *
 * @example
 * ```typescript
 * const recordAdapter = createRecordAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new consent record
 * const record = await recordAdapter.createRecord({
 *   userId: 'user-123',
 *   consentId: 'consent-456',
 *   actionType: 'given',
 *   details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
 * });
 * ```
 */
export function recordRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks } = getWithHooks(adapter, ctx);
	return {
		/**
		 * Creates a new consent record in the database.
		 * Automatically sets creation timestamp and applies any
		 * configured hooks during the creation process.
		 *
		 * @param record - Consent record data to create (without id and timestamp)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created consent record with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createRecord: async (
			record: Omit<Record, 'id' | 'createdAt' | 'updatedAt'> & Partial<Record>,
			context?: GenericEndpointContext
		) => {
			const createdRecord = await createWithHooks({
				data: {
					createdAt: record.createdAt || new Date(),
					updatedAt: record.updatedAt || new Date(),
					...record,
				},
				model: 'record',
				customFn: undefined,
				context,
			});

			if (!createdRecord) {
				throw new Error(
					'Failed to create consent record - operation returned null'
				);
			}

			return createdRecord as Record;
		},

		/**
		 * Finds all consent records matching specified filters.
		 * Returns records with processed output fields according to the schema configuration.
		 *
		 * @param userId - Optional user ID to filter records
		 * @param consentId - Optional consent ID to filter records
		 * @param actionType - Optional action type to filter records
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of consent records matching the criteria
		 */
		findRecords: async (
			userId?: string,
			consentId?: string,
			actionType?: string,
			limit?: number
		) => {
			const whereConditions: Where<'record'> = [];

			if (userId) {
				whereConditions.push({
					field: 'userId',
					value: userId,
				});
			}

			if (consentId) {
				whereConditions.push({
					field: 'consentId',
					value: consentId,
				});
			}

			if (actionType) {
				whereConditions.push({
					field: 'actionType',
					value: actionType,
				});
			}

			const records = await adapter.findMany({
				model: 'record',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});

			return records.map((record) =>
				validateEntityOutput('record', record, ctx.options)
			);
		},

		/**
		 * Finds a consent record by its unique ID.
		 * Returns the record with processed output fields according to the schema configuration.
		 *
		 * @param recordId - The unique identifier of the consent record
		 * @returns The consent record object if found, null otherwise
		 */
		findRecordById: async (recordId: string) => {
			const record = await adapter.findOne({
				model: 'record',
				where: [
					{
						field: 'id',
						value: recordId,
					},
				],
			});
			return record
				? validateEntityOutput('record', record, ctx.options)
				: null;
		},

		/**
		 * Finds all consent records for a specific user.
		 * Returns records with processed output fields according to the schema configuration.
		 *
		 * @param userId - The user ID to find consent records for
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of consent records associated with the user
		 */
		findRecordsByUserId: async (userId: string, limit?: number) => {
			const records = await adapter.findMany({
				model: 'record',
				where: [
					{
						field: 'userId',
						value: userId,
					},
				],
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});
			return records.map((record) =>
				validateEntityOutput('record', record, ctx.options)
			);
		},

		/**
		 * Finds all consent records for a specific consent.
		 * Returns records with processed output fields according to the schema configuration.
		 *
		 * @param consentId - The consent ID to find records for
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of consent records associated with the consent
		 */
		findRecordsByConsentId: async (consentId: string, limit?: number) => {
			const records = await adapter.findMany({
				model: 'record',
				where: [
					{
						field: 'consentId',
						value: consentId,
					},
				],
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});
			return records.map((record) =>
				validateEntityOutput('record', record, ctx.options)
			);
		},
	};
}
