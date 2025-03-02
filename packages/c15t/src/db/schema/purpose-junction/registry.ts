import type { GenericEndpointContext, RegistryContext } from '~/types';
import type { PurposeJunction } from './schema';

import { getWithHooks } from '~/db/hooks';
import { validateEntityOutput } from '../definition';

/**
 * Creates and returns a set of consent-purpose junction adapter methods to interact with the database.
 * These methods provide a consistent interface for creating, finding, and managing
 * relationships between consents and purposes while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe consent-purpose junction operations
 *
 * @example
 * ```typescript
 * const junctionAdapter = createPurposeJunctionAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new junction record
 * const junction = await junctionAdapter.createPurposeJunction({
 *   consentId: 'consent-123',
 *   purposeId: 'purpose-456',
 *   status: 'active'
 * });
 * ```
 */
export function purposeJunctionRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);
	return {
		/**
		 * Creates a new consent-purpose junction record in the database.
		 * Automatically sets creation timestamp and applies any
		 * configured hooks during the creation process.
		 *
		 * @param junction - Junction data to create (without id and timestamp)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created junction record with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createPurposeJunction: async (
			junction: Omit<PurposeJunction, 'id' | 'createdAt' | 'status'> &
				Partial<PurposeJunction>,
			context?: GenericEndpointContext
		) => {
			const createdJunction = await createWithHooks({
				data: {
					createdAt: new Date(),

					...junction,
					status: 'active',
				},
				model: 'purposeJunction',
				customFn: undefined,
				context,
			});

			if (!createdJunction) {
				throw new Error(
					'Failed to create consent-purpose junction - operation returned null'
				);
			}

			return createdJunction as PurposeJunction;
		},

		/**
		 * Finds all junction records for a specific consent.
		 * Returns junctions with processed output fields according to the schema configuration.
		 *
		 * @param consentId - The consent ID to find purposes for
		 * @returns Array of junction records associated with the consent
		 */
		findPurposesByConsentId: async (consentId: string) => {
			const junctions = await adapter.findMany({
				model: 'purposeJunction',
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
			});

			return junctions.map((junction) =>
				validateEntityOutput('purposeJunction', junction, ctx.options)
			);
		},

		/**
		 * Finds all junction records for a specific purpose.
		 * Returns junctions with processed output fields according to the schema configuration.
		 *
		 * @param purposeId - The purpose ID to find consents for
		 * @returns Array of junction records associated with the purpose
		 */
		findPurposesByPurposeId: async (purposeId: string) => {
			const junctions = await adapter.findMany({
				model: 'purposeJunction',
				where: [
					{
						field: 'purposeId',
						value: purposeId,
					},
				],
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
			});

			return junctions.map((junction) =>
				validateEntityOutput('purposeJunction', junction, ctx.options)
			);
		},

		/**
		 * Updates a junction record's status.
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param junctionId - The unique identifier of the junction to update
		 * @param status - The new status value ('active' or 'withdrawn')
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated junction if successful, null if not found or hooks prevented update
		 */
		updatePurposeJunction: async (
			junctionId: string,
			status: 'active' | 'withdrawn',
			context?: GenericEndpointContext
		) => {
			const junction = await updateWithHooks({
				data: {
					status,
					updatedAt: new Date(),
				},
				where: [
					{
						field: 'id',
						value: junctionId,
					},
				],
				model: 'purposeJunction',
				customFn: undefined,
				context,
			});
			return junction
				? validateEntityOutput('purposeJunction', junction, ctx.options)
				: null;
		},

		/**
		 * Deletes all junction records for a specific consent.
		 * This effectively removes all purpose connections for the consent.
		 *
		 * @param consentId - The ID of the consent to remove all purpose connections for
		 * @returns True if successful, false otherwise
		 */
		deletePurposeJunctionsByConsentId: async (consentId: string) => {
			try {
				await adapter.deleteMany({
					model: 'purposeJunction',
					where: [
						{
							field: 'consentId',
							value: consentId,
						},
					],
				});
				return true;
			} catch (error) {
				ctx.logger.error('Error deleting consent-purpose junctions:', error);
				return false;
			}
		},
	};
}
