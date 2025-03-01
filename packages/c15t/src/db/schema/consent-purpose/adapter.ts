import type { Where, GenericEndpointContext } from '~/types';
import { type ConsentPurpose, parseConsentPurposeOutput } from './schema';
import type { InternalAdapterContext } from '~/db/internal-adapter';
import { getWithHooks } from '~/db/hooks';

/**
 * Creates and returns a set of consent purpose-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating, finding, and updating
 * consent purpose records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param createWithHooks - Function to create records with before/after hooks
 * @param updateWithHooks - Function to update records with before/after hooks
 * @param options - Configuration options for the C15T system
 * @returns An object containing type-safe consent purpose operations
 *
 * @example
 * ```typescript
 * const purposeAdapter = createConsentPurposeAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new consent purpose
 * const purpose = await purposeAdapter.createConsentPurpose({
 *   code: 'marketing',
 *   name: 'Marketing Communications',
 *   description: 'Allow us to send you marketing materials',
 *   isEssential: false
 * });
 * ```
 */
export function createConsentPurposeAdapter({
	adapter,
	ctx,
}: InternalAdapterContext) {
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
		createConsentPurpose: async (
			purpose: Omit<ConsentPurpose, 'id' | 'createdAt' | 'updatedAt'> &
				Partial<ConsentPurpose>,
			context?: GenericEndpointContext
		) => {
			const createdPurpose = await createWithHooks(
				{
					createdAt: new Date(),
					updatedAt: new Date(),
					// isActive: new Date(),
					...purpose,
				},
				'consentPurpose',
				undefined,
				context
			);

			if (!createdPurpose) {
				throw new Error(
					'Failed to create consent purpose - operation returned null'
				);
			}

			return createdPurpose as ConsentPurpose;
		},

		/**
		 * Finds all consent purposes, optionally including inactive ones.
		 * Returns purposes with processed output fields according to the schema configuration.
		 *
		 * @param includeInactive - Whether to include inactive purposes (default: false)
		 * @returns Array of consent purposes matching the criteria
		 */
		findConsentPurposes: async (includeInactive?: boolean) => {
			const whereConditions: Where[] = [];

			if (!includeInactive) {
				whereConditions.push({
					field: 'isActive',
					value: true,
				});
			}

			const purposes = await adapter.findMany<ConsentPurpose>({
				model: 'consentPurpose',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'asc',
				},
			});

			return purposes.map((purpose) =>
				parseConsentPurposeOutput(ctx.options, purpose)
			);
		},

		/**
		 * Finds a consent purpose by its unique ID.
		 * Returns the purpose with processed output fields according to the schema configuration.
		 *
		 * @param purposeId - The unique identifier of the purpose
		 * @returns The purpose object if found, null otherwise
		 */
		findConsentPurposeById: async (purposeId: string) => {
			const purpose = await adapter.findOne<ConsentPurpose>({
				model: 'consentPurpose',
				where: [
					{
						field: 'id',
						value: purposeId,
					},
				],
			});
			return purpose ? parseConsentPurposeOutput(ctx.options, purpose) : null;
		},

		/**
		 * Updates an existing consent purpose record by ID.
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param purposeId - The unique identifier of the purpose to update
		 * @param data - The fields to update on the purpose record
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated purpose if successful, null if not found or hooks prevented update
		 */
		updateConsentPurpose: async (
			purposeId: string,
			data: Partial<ConsentPurpose>,
			context?: GenericEndpointContext
		) => {
			const purpose = await updateWithHooks<ConsentPurpose>(
				{
					...data,
					updatedAt: new Date(),
				},
				[
					{
						field: 'id',
						value: purposeId,
					},
				],
				'consentPurpose',
				undefined,
				context
			);
			return purpose ? parseConsentPurposeOutput(ctx.options, purpose) : null;
		},
	};
}
