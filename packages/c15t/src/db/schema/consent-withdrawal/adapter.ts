import type { Where } from '~/types';
import type { GenericEndpointContext } from '~/types';
import { type ConsentWithdrawal, parseConsentWithdrawalOutput } from './schema';
import { getWithHooks } from '~/db/hooks';
import type { InternalAdapterContext } from '~/db/internal-adapter';

/**
 * Creates and returns a set of consent withdrawal adapter methods to interact with the database.
 * These methods provide a consistent interface for creating and querying withdrawal records
 * while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param createWithHooks - Function to create records with before/after hooks
 * @param options - Configuration options for the C15T system
 * @returns An object containing type-safe consent withdrawal operations
 *
 * @example
 * ```typescript
 * const withdrawalAdapter = createConsentWithdrawalAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new withdrawal record
 * const withdrawal = await withdrawalAdapter.createWithdrawal({
 *   consentId: 'consent-123',
 *   userId: 'user-456',
 *   withdrawalReason: 'No longer wish to receive marketing emails',
 *   withdrawalMethod: 'user-initiated'
 * });
 * ```
 */
export function createConsentWithdrawalAdapter({
	adapter,
	ctx,
}: InternalAdapterContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);
	return {
		/**
		 * Creates a new consent withdrawal record in the database.
		 * Automatically sets creation timestamp and applies any
		 * configured hooks during the creation process.
		 *
		 * @param withdrawal - Withdrawal data to create (without id and timestamp)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created withdrawal record with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createWithdrawal: async (
			withdrawal: Omit<ConsentWithdrawal, 'id' | 'createdAt'> &
				Partial<ConsentWithdrawal>,
			context?: GenericEndpointContext
		) => {
			const createdWithdrawal = await createWithHooks(
				{
					createdAt: new Date(),
					...withdrawal,
				},
				'consentWithdrawal',
				undefined,
				context
			);

			if (!createdWithdrawal) {
				throw new Error(
					'Failed to create consent withdrawal - operation returned null'
				);
			}

			return createdWithdrawal as ConsentWithdrawal;
		},

		/**
		 * Finds all withdrawal records matching specified filters.
		 * Returns withdrawals with processed output fields according to the schema configuration.
		 *
		 * @param userId - Optional user ID to filter withdrawals
		 * @param consentId - Optional consent ID to filter withdrawals
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of withdrawal records matching the criteria
		 */
		findWithdrawals: async (
			userId?: string,
			consentId?: string,
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

			const withdrawals = await adapter.findMany<ConsentWithdrawal>({
				model: 'consentWithdrawal',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});

			return withdrawals.map((withdrawal) =>
				parseConsentWithdrawalOutput(ctx.options, withdrawal)
			);
		},

		/**
		 * Finds a withdrawal record by its unique ID.
		 * Returns the withdrawal with processed output fields according to the schema configuration.
		 *
		 * @param withdrawalId - The unique identifier of the withdrawal record
		 * @returns The withdrawal object if found, null otherwise
		 */
		findWithdrawalById: async (withdrawalId: string) => {
			const withdrawal = await adapter.findOne<ConsentWithdrawal>({
				model: 'consentWithdrawal',
				where: [
					{
						field: 'id',
						value: withdrawalId,
					},
				],
			});
			return withdrawal
				? parseConsentWithdrawalOutput(ctx.options, withdrawal)
				: null;
		},

		/**
		 * Finds all withdrawal records for a specific user.
		 * Returns withdrawals with processed output fields according to the schema configuration.
		 *
		 * @param userId - The user ID to find withdrawals for
		 * @param limit - Optional maximum number of records to return
		 * @returns Array of withdrawal records associated with the user
		 */
		findWithdrawalsByUserId: async (userId: string, limit?: number) => {
			const withdrawals = await adapter.findMany<ConsentWithdrawal>({
				model: 'consentWithdrawal',
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
			return withdrawals.map((withdrawal) =>
				parseConsentWithdrawalOutput(ctx.options, withdrawal)
			);
		},

		/**
		 * Finds a withdrawal record for a specific consent.
		 * Returns the withdrawal with processed output fields according to the schema configuration.
		 * This is useful when you need to know if and why a specific consent was withdrawn.
		 *
		 * @param consentId - The consent ID to find withdrawal for
		 * @returns The withdrawal record if found, null otherwise
		 */
		findWithdrawalByConsentId: async (consentId: string) => {
			const withdrawal = await adapter.findOne<ConsentWithdrawal>({
				model: 'consentWithdrawal',
				where: [
					{
						field: 'consentId',
						value: consentId,
					},
				],
				// sortBy: {
				// 	field: 'createdAt',
				// 	direction: 'desc',
				// },
			});
			return withdrawal
				? parseConsentWithdrawalOutput(ctx.options, withdrawal)
				: null;
		},
	};
}
