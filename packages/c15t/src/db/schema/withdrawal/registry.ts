import type { RegistryContext } from '~/types';
import type { GenericEndpointContext } from '~/types';
import type { Withdrawal } from './schema';
import { getWithHooks } from '~/db/hooks';
import { validateEntityOutput } from '../definition';
import type { Where } from '~/db/adapters/types';

/**
 * Creates and returns a set of consent withdrawal adapter methods to interact with the database.
 * These methods provide a consistent interface for creating and querying withdrawal records
 * while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe consent withdrawal operations
 *
 * @example
 * ```typescript
 * const withdrawalAdapter = createWithdrawalAdapter(
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
export function withdrawalRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks } = getWithHooks(adapter, ctx);
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
			withdrawal: Omit<Withdrawal, 'id' | 'createdAt'> & Partial<Withdrawal>,
			context?: GenericEndpointContext
		) => {
			const createdWithdrawal = await createWithHooks({
				data: {
					createdAt: new Date(),
					...withdrawal,
				},
				model: 'withdrawal',
				customFn: undefined,
				context,
			});

			if (!createdWithdrawal) {
				throw new Error(
					'Failed to create consent withdrawal - operation returned null'
				);
			}

			return validateEntityOutput('withdrawal', createdWithdrawal, ctx.options);
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
			const whereConditions: Where<'withdrawal'> = [];

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

			const withdrawals = await adapter.findMany({
				model: 'withdrawal',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
				limit,
			});

			return withdrawals.map((withdrawal) =>
				validateEntityOutput('withdrawal', withdrawal, ctx.options)
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
			const withdrawal = await adapter.findOne({
				model: 'withdrawal',
				where: [
					{
						field: 'id',
						value: withdrawalId,
					},
				],
			});
			return withdrawal
				? validateEntityOutput('withdrawal', withdrawal, ctx.options)
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
			const withdrawals = await adapter.findMany({
				model: 'withdrawal',
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
				validateEntityOutput('withdrawal', withdrawal, ctx.options)
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
			const withdrawal = await adapter.findOne({
				model: 'withdrawal',
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
				? validateEntityOutput('withdrawal', withdrawal, ctx.options)
				: null;
		},
	};
}
