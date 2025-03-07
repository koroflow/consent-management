import type { Where } from '~/db/adapters/types';
import { getWithHooks } from '~/db/hooks';
import type { GenericEndpointContext, RegistryContext } from '~/types';
import { validateEntityOutput } from '../definition';
import type { Purpose } from './schema';

/**
 * Creates and returns a set of consent purpose-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating, finding, and updating
 * consent purpose records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe consent purpose operations
 *
 * @example
 * ```typescript
 * const purposeAdapter = createPurposeAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new consent purpose
 * const purpose = await purposeAdapter.createPurpose({
 *   code: 'marketing',
 *   name: 'Marketing Communications',
 *   description: 'Allow us to send you marketing materials',
 *   isEssential: false
 * });
 * ```
 */
export function purposeRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);
	return {
		/**
		 * Creates a new consent purpose record in the database.
		 * Automatically sets creation and update timestamps and applies any
		 * configured hooks during the creation process.
		 *
		 * @param purpose - Purpose data to create (without id and timestamps)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created purpose with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createPurpose: async (
			purpose: Omit<Purpose, 'id' | 'createdAt' | 'updatedAt'> &
				Partial<Purpose>,
			context?: GenericEndpointContext
		) => {
			const createdPurpose = await createWithHooks({
				data: {
					id: purpose.id || '',
					createdAt: new Date(),
					updatedAt: new Date(),
					...purpose,
				},
				model: 'purpose',
				context,
			});

			if (!createdPurpose) {
				throw new Error(
					'Failed to create consent purpose - operation returned null'
				);
			}

			return validateEntityOutput('purpose', createdPurpose, ctx.options);
		},

		/**
		 * Finds all consent purposes, optionally including inactive ones.
		 * Returns purposes with processed output fields according to the schema configuration.
		 *
		 * @param includeInactive - Whether to include inactive purposes (default: false)
		 * @returns Array of consent purposes matching the criteria
		 */
		findPurposes: async (includeInactive?: boolean) => {
			const whereConditions: Where<'purpose'> = [];

			if (!includeInactive) {
				whereConditions.push({
					field: 'isActive',
					value: true,
				});
			}

			const purposes = await adapter.findMany({
				model: 'purpose',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'asc',
				},
			});

			return purposes.map((purpose) =>
				validateEntityOutput('purpose', purpose, ctx.options)
			);
		},

		/**
		 * Finds a consent purpose by its unique ID.
		 * Returns the purpose with processed output fields according to the schema configuration.
		 *
		 * @param purposeId - The unique identifier of the purpose
		 * @returns The purpose object if found, null otherwise
		 */
		findPurposeById: async (purposeId: string) => {
			const purpose = await adapter.findOne({
				model: 'purpose',
				where: [
					{
						field: 'id',
						value: purposeId,
					},
				],
			});
			return purpose
				? validateEntityOutput('purpose', purpose, ctx.options)
				: null;
		},

		/**
		 * Finds a consent purpose by its unique code.
		 * Returns the purpose with processed output fields according to the schema configuration.
		 *
		 * @param code - The unique code of the purpose
		 * @returns The purpose object if found, null otherwise
		 */
		findPurposeByCode: async (code: string) => {
			const purpose = await adapter.findOne({
				model: 'purpose',
				where: [
					{
						field: 'code',
						value: code,
					},
				],
			});
			return purpose
				? validateEntityOutput('purpose', purpose, ctx.options)
				: null;
		},

		/**
     * 
		/**
     * 
		 * Updates an existing consent purpose record by ID.
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param purposeId - The unique identifier of the purpose to update
		 * @param data - The fields to update on the purpose record
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated purpose if successful, null if not found or hooks prevented update
		 */
		updatePurpose: async (
			purposeId: string,
			data: Partial<Purpose>,
			context?: GenericEndpointContext
		) => {
			const purpose = await updateWithHooks({
				data: {
					...data,
					updatedAt: new Date(),
				},
				where: [
					{
						field: 'id',
						value: purposeId,
					},
				],
				model: 'purpose',
				context,
			});
			return purpose
				? validateEntityOutput('purpose', purpose, ctx.options)
				: null;
		},
	};
}
