import type { C15TOptions, Where } from '~/types';
import type { Adapter, GenericEndpointContext } from '~/types';
import { type ConsentRecord, parseConsentRecordOutput } from './schema';
import type { CreateWithHooks } from '~/db/hooks/types';

/**
 * Creates and returns a set of consent record-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating and querying consent records
 * while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param createWithHooks - Function to create records with before/after hooks
 * @param options - Configuration options for the C15T system
 * @returns An object containing type-safe consent record operations
 *
 * @example
 * ```typescript
 * const recordAdapter = createConsentRecordAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new consent record
 * const record = await recordAdapter.createConsentRecord({
 *   userId: 'user-123',
 *   consentId: 'consent-456',
 *   actionType: 'given',
 *   details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
 * });
 * ```
 */
export function createConsentRecordAdapter(
	adapter: Adapter,
	createWithHooks: CreateWithHooks,
	options: C15TOptions
) {
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
		createConsentRecord: async (
			record: Omit<ConsentRecord, 'id' | 'createdAt'> & Partial<ConsentRecord>,
			context?: GenericEndpointContext
		) => {
			const createdRecord = await createWithHooks(
				{
					createdAt: new Date(),
					...record,
				},
				'consentRecord',
				undefined,
				context
			);

			if (!createdRecord) {
				throw new Error(
					'Failed to create consent record - operation returned null'
				);
			}

			return createdRecord as ConsentRecord;
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
		findConsentRecords: async (
			userId?: string,
			consentId?: string,
			actionType?: string,
			limit?: number
		) => {
			const whereConditions: Where[] = [];

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

			const records = await adapter.findMany<ConsentRecord>({
				model: 'consentRecord',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});

			return records.map((record) => parseConsentRecordOutput(options, record));
		},

		/**
		 * Finds a consent record by its unique ID.
		 * Returns the record with processed output fields according to the schema configuration.
		 *
		 * @param recordId - The unique identifier of the consent record
		 * @returns The consent record object if found, null otherwise
		 */
		findConsentRecordById: async (recordId: string) => {
			const record = await adapter.findOne<ConsentRecord>({
				model: 'consentRecord',
				where: [
					{
						field: 'id',
						value: recordId,
					},
				],
			});
			return record ? parseConsentRecordOutput(options, record) : null;
		},

		/**
		 * Finds all consent records for a specific user.
		 * Returns records with processed output fields according to the schema configuration.
		 *
		 * @param userId - The user ID to find consent records for
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of consent records associated with the user
		 */
		findConsentRecordsByUserId: async (userId: string, limit?: number) => {
			const records = await adapter.findMany<ConsentRecord>({
				model: 'consentRecord',
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
			return records.map((record) => parseConsentRecordOutput(options, record));
		},

		/**
		 * Finds all consent records for a specific consent.
		 * Returns records with processed output fields according to the schema configuration.
		 *
		 * @param consentId - The consent ID to find records for
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of consent records associated with the consent
		 */
		findConsentRecordsByConsentId: async (
			consentId: string,
			limit?: number
		) => {
			const records = await adapter.findMany<ConsentRecord>({
				model: 'consentRecord',
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
			return records.map((record) => parseConsentRecordOutput(options, record));
		},
	};
}
