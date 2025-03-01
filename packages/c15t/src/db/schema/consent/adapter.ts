import type { C15TOptions, Where } from '~/types';
import type { Adapter, GenericEndpointContext } from '~/types';
import { type Consent, parseConsentOutput } from './schema';
import type { CreateWithHooks, UpdateWithHooks } from '~/db/hooks/types';

/**
 * Creates and returns a set of consent-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating, finding, and updating
 * consent records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param createWithHooks - Function to create records with before/after hooks
 * @param updateWithHooks - Function to update records with before/after hooks
 * @param options - Configuration options for the C15T system
 * @returns An object containing type-safe consent operations
 *
 * @example
 * ```typescript
 * const consentAdapter = createConsentAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new consent record
 * const consent = await consentAdapter.createConsent({
 *   userId: 'user-123',
 *   domainId: 'domain-456',
 *   purposeIds: ['purpose-789'],
 *   status: 'active'
 * });
 * ```
 */
export function createConsentAdapter(
	adapter: Adapter,
	createWithHooks: CreateWithHooks,
	updateWithHooks: UpdateWithHooks,
	options: C15TOptions
) {
	return {
		/**
		 * Creates a new consent record in the database.
		 * Automatically sets creation timestamp and applies any
		 * configured hooks during the creation process.
		 *
		 * @param consent - Consent data to create (without id and timestamp)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created consent with all fields populated
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createConsent: async (
			consent: Omit<Consent, 'id' | 'createdAt'> & Partial<Consent>,
			context?: GenericEndpointContext
		) => {
			const createdConsent = await createWithHooks(
				{
					createdAt: new Date(),
					// status: 'active',
					...consent,
				},
				'consent',
				undefined,
				context
			);

			if (!createdConsent) {
				throw new Error('Failed to create consent - operation returned null');
			}

			return createdConsent as Consent;
		},

		/**
		 * Finds all consents matching specified filters.
		 * Returns consents with processed output fields according to the schema configuration.
		 *
		 * @param userId - Optional user ID to filter consents
		 * @param domainId - Optional domain ID to filter consents
		 * @param purposeIds - Optional array of purpose IDs to filter consents
		 * @returns Array of consents matching the criteria
		 */
		findConsents: async (
			userId?: string,
			domainId?: string,
			purposeIds?: string[]
		) => {
			const whereConditions: Where[] = [];

			if (userId) {
				whereConditions.push({
					field: 'userId',
					value: userId,
				});
			}

			if (domainId) {
				whereConditions.push({
					field: 'domainId',
					value: domainId,
				});
			}

			if (purposeIds && purposeIds.length > 0) {
				whereConditions.push({
					field: 'purposeIds',
					operator: 'contains',
					value: purposeIds,
				});
			}

			const consents = await adapter.findMany<Consent>({
				model: 'consent',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'desc',
				},
			});

			return consents.map((consent) => parseConsentOutput(options, consent));
		},

		/**
		 * Finds a consent by its unique ID.
		 * Returns the consent with processed output fields according to the schema configuration.
		 *
		 * @param consentId - The unique identifier of the consent
		 * @returns The consent object if found, null otherwise
		 */
		findConsentById: async (consentId: string) => {
			const consent = await adapter.findOne<Consent>({
				model: 'consent',
				where: [
					{
						field: 'id',
						value: consentId,
					},
				],
			});
			return consent ? parseConsentOutput(options, consent) : null;
		},

		/**
		 * Finds all consents for a specific user.
		 * Returns consents with processed output fields according to the schema configuration.
		 *
		 * @param userId - The user ID to find consents for
		 * @returns Array of consents associated with the user
		 */
		findConsentsByUserId: async (userId: string) => {
			const consents = await adapter.findMany<Consent>({
				model: 'consent',
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
			});
			return consents.map((consent) => parseConsentOutput(options, consent));
		},

		/**
		 * Updates an existing consent record by ID.
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param consentId - The unique identifier of the consent to update
		 * @param data - The fields to update on the consent record
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated consent if successful, null if not found or hooks prevented update
		 */
		updateConsent: async (
			consentId: string,
			data: Partial<Consent>,
			context?: GenericEndpointContext
		) => {
			const consent = await updateWithHooks<Consent>(
				{
					...data,
					updatedAt: new Date(),
				},
				[
					{
						field: 'id',
						value: consentId,
					},
				],
				'consent',
				undefined,
				context
			);
			return consent ? parseConsentOutput(options, consent) : null;
		},

		/**
		 * Withdraws consent by ID (updates status to withdrawn).
		 * Also records the withdrawal reason if provided.
		 *
		 * @param consentId - The unique identifier of the consent to withdraw
		 * @param withdrawalReason - Optional reason for withdrawal
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated consent with withdrawn status
		 */
		withdrawConsent: async (
			consentId: string,
			withdrawalReason?: string,
			context?: GenericEndpointContext
		) => {
			const updateData: Partial<Consent> = {
				status: 'withdrawn',
				updatedAt: new Date(),
			};

			if (withdrawalReason) {
				updateData.withdrawalReason = withdrawalReason;
			}

			const consent = await updateWithHooks<Consent>(
				updateData,
				[
					{
						field: 'id',
						value: consentId,
					},
				],
				'consent',
				undefined,
				context
			);
			return consent ? parseConsentOutput(options, consent) : null;
		},

		// revokeConsent: async ({
		// 	consentId,
		// 	reason,
		// 	actor,
		// 	metadata,
		// 	context,
		// }: {
		// 	consentId: string;
		// 	reason: string;
		// 	actor: string;
		// 	metadata?: Record<string, unknown>;
		// 	context?: GenericEndpointContext;
		// }) => {
		// 	// Mark consent as inactive
		// 	const updatedConsent = await consentAdapter.updateConsent(
		// 		consentId,
		// 		{
		// 			isActive: false,
		// 		},
		// 		context
		// 	);

		// 	if (!updatedConsent) {
		// 		return null;
		// 	}

		// 	// Create withdrawal record
		// 	const withdrawal = await withdrawalAdapter.createWithdrawal(
		// 		{
		// 			consentId,
		// 			withdrawalReason: reason,
		// 			withdrawalMethod: 'api',
		// 			actor,
		// 			metadata: metadata || {},
		// 		},
		// 		context
		// 	);

		// 	return {
		// 		consent: updatedConsent,
		// 		withdrawal,
		// 	};
		// },
	};
}
