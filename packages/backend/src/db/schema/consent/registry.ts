import type { GenericEndpointContext, RegistryContext } from '~/types';
import type { Consent } from './schema';
import { getWithHooks } from '~/db/hooks';
import { validateEntityOutput } from '../definition';
import type { Where } from '~/db/adapters/types';

export interface FindConsentsParams {
	userId?: string;
	domainId?: string;
	status?: string;
	purposeIds?: string[];
	includeInactive?: boolean;
}

export interface RevokeConsentParams {
	consentId: string;
	reason: string;
	actor: string;
	metadata?: Record<string, unknown>;
	context?: GenericEndpointContext;
}

/**
 * Creates and returns a set of consent-related adapter methods to interact with the database.
 * These methods provide a consistent interface for creating, finding, and updating
 * consent records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
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
export function consentRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);
	const registry = {
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
			const createdConsent = await createWithHooks({
				data: {
					createdAt: new Date(),
					...consent,
				},
				model: 'consent',
				context,
			});

			if (!createdConsent) {
				throw new Error('Failed to create consent - operation returned null');
			}

			return createdConsent as Consent;
		},

		/**
		 * Finds all consents matching specified filters.
		 * Returns consents with processed output fields according to the schema configuration.
		 *
		 * @param params - Filter parameters
		 * @returns Array of consents matching the criteria
		 */
		findConsents: async (params: FindConsentsParams = {}) => {
			const whereConditions: Where<'consent'> = [];

			if (!params.includeInactive) {
				whereConditions.push({
					field: 'isActive',
					value: true,
				});
			}

			if (params.userId) {
				whereConditions.push({
					field: 'userId',
					value: params.userId,
				});
			}

			if (params.domainId) {
				whereConditions.push({
					field: 'domainId',
					value: params.domainId,
				});
			}

			if (params.status) {
				whereConditions.push({
					field: 'status',
					value: params.status,
				});
			}

			if (params.purposeIds && params.purposeIds.length > 0) {
				whereConditions.push({
					field: 'purposeIds',
					operator: 'contains',
					value: params.purposeIds,
				});
			}

			const consents = await adapter.findMany({
				model: 'consent',
				where: whereConditions,
				sortBy: {
					field: 'givenAt',
					direction: 'desc',
				},
			});

			return consents.map((consent) =>
				validateEntityOutput('consent', consent, ctx.options)
			);
		},

		/**
		 * Finds a consent by its unique ID.
		 * Returns the consent with processed output fields according to the schema configuration.
		 *
		 * @param consentId - The unique identifier of the consent
		 * @returns The consent object if found, null otherwise
		 */
		findConsentById: async (consentId: string) => {
			const consent = await adapter.findOne({
				model: 'consent',
				where: [
					{
						field: 'id',
						value: consentId,
					},
				],
			});
			return consent
				? validateEntityOutput('consent', consent, ctx.options)
				: null;
		},

		/**
		 * Finds all consents for a specific user.
		 * Returns consents with processed output fields according to the schema configuration.
		 *
		 * @param userId - The user ID to find consents for
		 * @returns Array of consents associated with the user
		 */
		findConsentsByUserId: async (userId: string) => {
			const consents = await adapter.findMany({
				model: 'consent',
				where: [
					{
						field: 'userId',
						value: userId,
					},
				],
				sortBy: {
					field: 'givenAt',
					direction: 'desc',
				},
			});
			return consents.map((consent) =>
				validateEntityOutput('consent', consent, ctx.options)
			);
		},

		/**
		 * Finds all consents for a specific domain.
		 * Returns consents with processed output fields according to the schema configuration.
		 *
		 * @param domainId - The domain ID to find consents for
		 * @returns Array of consents associated with the domain
		 */
		findConsentsByDomainId: async (domainId: string) => {
			const consents = await adapter.findMany({
				model: 'consent',
				where: [
					{
						field: 'domainId',
						value: domainId,
					},
				],
				sortBy: {
					field: 'givenAt',
					direction: 'desc',
				},
			});
			return consents.map((consent) =>
				validateEntityOutput('consent', consent, ctx.options)
			);
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
			const consent = await updateWithHooks<Consent>({
				data: {
					...data,
				},
				where: [
					{
						field: 'id',
						value: consentId,
					},
				],
				model: 'consent',
				context,
			});
			return consent
				? validateEntityOutput('consent', consent, ctx.options)
				: null;
		},

		/**
		 * Updates consent status to withdrawn.
		 * Also records the withdrawal reason if provided.
		 *
		 * @param consentId - The unique identifier of the consent to update
		 * @param withdrawalReason - Optional reason for withdrawal
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated consent with withdrawn status
		 */
		updateWithdrawal: async (
			consentId: string,
			withdrawalReason?: string,
			context?: GenericEndpointContext
		) => {
			const updateData: Partial<Consent> = {
				status: 'withdrawn',
			};

			if (withdrawalReason) {
				updateData.withdrawalReason = withdrawalReason;
			}

			const consent = await updateWithHooks<Consent>({
				data: updateData,
				where: [
					{
						field: 'id',
						value: consentId,
					},
				],
				model: 'consent',
				context,
			});

			return consent
				? validateEntityOutput('consent', consent, ctx.options)
				: null;
		},

		/**
		 * Revokes a consent and records the revocation details.
		 *
		 * @param params - Revocation parameters including reason and actor
		 * @returns The updated consent with revocation details
		 */
		revokeConsent: async ({
			consentId,
			reason,
			actor,
			metadata,
			context,
		}: RevokeConsentParams) => {
			const consent = await registry.findConsentById(consentId);
			if (!consent) {
				throw new Error('Consent not found');
			}

			const updateData: Partial<Consent> = {
				status: 'withdrawn',
				withdrawalReason: reason,
				metadata: {
					...(consent.metadata as Record<string, unknown>),
					withdrawal: {
						actor,
						timestamp: new Date().toISOString(),
						...metadata,
					},
				},
			};

			return registry.updateConsent(consentId, updateData, context);
		},

		/**
		 * Gets all records associated with a consent.
		 *
		 * @param consentId - The ID of the consent
		 * @returns Array of records associated with the consent
		 */
		getRecords: async (consentId: string) => {
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
			});

			return records.map((record) =>
				validateEntityOutput('record', record, ctx.options)
			);
		},

		/**
		 * Gets all withdrawals associated with a consent.
		 *
		 * @param consentId - The ID of the consent
		 * @returns Array of withdrawals associated with the consent
		 */
		getWithdrawals: async (consentId: string) => {
			const withdrawals = await adapter.findMany({
				model: 'withdrawal',
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

			return withdrawals.map((withdrawal) =>
				validateEntityOutput('withdrawal', withdrawal, ctx.options)
			);
		},
	};

	return registry;
}
