import type { Adapter } from '~/db/adapters/types';
import { getWithHooks } from '~/db/hooks';
import { BASE_ERROR_CODES, C15TError } from '~/error';
import type { GenericEndpointContext, RegistryContext } from '~/types';
import { validateEntityOutput } from '../definition';
import type { Subject } from './schema';
/**
 * Creates and returns a set of subject-related adapter methods to interact with the database.
 *
 * These methods provide a consistent interface for creating, finding, updating, and deleting
 * subject records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe subject operations
 *
 * @example
 * ```typescript
 * const userAdapter = createSubjectAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new subject
 * const subject = await userAdapter.createSubject({
 *   externalId: 'external-123',
 *   identityProvider: 'auth0'
 * });
 * ```
 */
export function subjectRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);

	return {
		/**
		 * Creates a new subject record in the database.
		 *
		 * Automatically sets creation and update timestamps and applies any
		 * configured hooks during the creation process.
		 *
		 * @param subject - Subject data to create (without id and timestamps)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created subject with all fields populated
		 *
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createSubject: async (
			subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> &
				Partial<Subject>,
			context?: GenericEndpointContext
		) => {
			const createdUser = await createWithHooks({
				data: {
					createdAt: new Date(),
					updatedAt: new Date(),
					...subject,
				},
				model: 'subject',
				customFn: undefined,
				context,
			});
			return createdUser
				? validateEntityOutput('subject', createdUser, ctx.options)
				: null;
		},

		/**
		 * Finds an existing subject or creates a new one if needed.
		 * If both subjectId and externalUserId are provided, validates they match the same subject.
		 * Creates a new anonymous subject only if no identifiers are provided.
		 *
		 * @param params - Parameters for finding or creating the subject
		 * @returns The existing or newly created subject
		 * @throws APIError if subject validation fails or creation fails
		 */
		findOrcreateSubject: async function ({
			subjectId,
			externalUserId,
			ipAddress = 'unknown',
			context,
		}: {
			subjectId?: string;
			externalUserId?: string;
			ipAddress?: string;
			context?: GenericEndpointContext;
		}) {
			// If both subjectId and externalUserId are provided, validate they match
			if (subjectId && externalUserId) {
				const [userById, userByExternalId] = await Promise.all([
					this.findUserById(subjectId),
					this.findUserByExternalId(externalUserId),
				]);

				if (!userById || !userByExternalId) {
					ctx.logger?.info(
						'Subject validation failed: One or both subjects not found',
						{
							providedUserId: subjectId,
							providedExternalId: externalUserId,
							userByIdFound: !!userById,
							userByExternalIdFound: !!userByExternalId,
						}
					);
					throw new C15TError(
						'The specified subject could not be found. Please verify the subject identifiers and try again.',
						{
							code: BASE_ERROR_CODES.NOT_FOUND,
							status: 404,
							data: {
								providedUserId: subjectId,
								providedExternalId: externalUserId,
							},
						}
					);
				}

				if (userById.id !== userByExternalId.id) {
					ctx.logger?.warn(
						'Subject validation failed: IDs do not match the same subject',
						{
							providedUserId: subjectId,
							providedExternalId: externalUserId,
							userByIdId: userById.id,
							userByExternalIdId: userByExternalId.id,
						}
					);
					throw new C15TError(
						'The provided subjectId and externalUserId do not match the same subject. Please ensure both identifiers refer to the same subject.',
						{
							code: BASE_ERROR_CODES.CONFLICT,
							status: 409,
							data: {
								providedUserId: subjectId,
								providedExternalId: externalUserId,
								userByIdId: userById.id,
								userByExternalIdId: userByExternalId.id,
							},
						}
					);
				}

				return userById;
			}

			// Try to find subject by subjectId if provided
			if (subjectId) {
				const subject = await this.findUserById(subjectId);
				if (subject) {
					return subject;
				}
				throw new C15TError('Subject not found', {
					code: BASE_ERROR_CODES.NOT_FOUND,
					status: 404,
				});
			}

			// If externalUserId provided, try to find or create with upsert
			if (externalUserId) {
				try {
					const subject = await this.findUserByExternalId(externalUserId);
					if (subject) {
						ctx.logger?.debug('Found existing subject by external ID', {
							externalUserId,
						});
						return subject;
					}

					ctx.logger?.info('Creating new subject with external ID', {
						externalUserId,
					});
					// Attempt to create with unique constraint on externalId
					return await this.createSubject(
						{
							externalId: externalUserId,
							identityProvider: 'external',
							lastIpAddress: ipAddress,
							isIdentified: true,
						},
						context
					);
				} catch (error) {
					// If creation failed due to duplicate, try to find again
					if (
						error instanceof Error &&
						error.message.includes('unique constraint')
					) {
						ctx.logger?.info(
							'Handling duplicate key violation for external ID',
							{ externalUserId }
						);
						const subject = await this.findUserByExternalId(externalUserId);
						if (subject) {
							return subject;
						}
					}
					ctx.logger?.error(
						'Failed to create or find subject with external ID',
						{
							externalUserId,
							error: error instanceof Error ? error.message : 'Unknown error',
						}
					);
					throw new C15TError(
						'Failed to create or find subject with external ID',
						{
							code: BASE_ERROR_CODES.INTERNAL_SERVER_ERROR,
							status: 500,
							data: {
								error: error instanceof Error ? error.message : 'Unknown error',
							},
						}
					);
				}
			}

			// For anonymous subjects, use a transaction to prevent duplicates
			try {
				ctx.logger?.info('Creating new anonymous subject');
				return await this.createSubject(
					{
						externalId: null,
						identityProvider: 'anonymous',
						lastIpAddress: ipAddress,
						isIdentified: false,
					},
					context
				);
			} catch (error) {
				ctx.logger?.error('Failed to create anonymous subject', {
					ipAddress,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
				throw new C15TError('Failed to create anonymous subject', {
					code: BASE_ERROR_CODES.INTERNAL_SERVER_ERROR,
					status: 500,
					data: {
						error: error instanceof Error ? error.message : 'Unknown error',
					},
				});
			}
		},

		/**
		 * Finds a subject by their unique ID.
		 *
		 * Returns the subject with processed output fields according to the schema configuration.
		 *
		 * @param subjectId - The unique identifier of the subject
		 * @returns The subject object if found, null otherwise
		 */
		findUserById: async (subjectId: string) => {
			const subject = await adapter.findOne({
				model: 'subject',
				where: [
					{
						field: 'id',
						value: subjectId,
					},
				],
			});
			return subject
				? validateEntityOutput('subject', subject, ctx.options)
				: null;
		},

		/**
		 * Finds a subject by their external ID.
		 *
		 * This is useful when integrating with external authentication systems
		 * where subjects are identified by a provider-specific ID.
		 *
		 * @param externalId - The external identifier of the subject
		 * @returns The subject object if found, null otherwise
		 */
		findUserByExternalId: async (externalId: string) => {
			const subject = await adapter.findOne({
				model: 'subject',
				where: [
					{
						field: 'externalId',
						value: externalId,
					},
				],
			});
			return subject
				? validateEntityOutput('subject', subject, ctx.options)
				: null;
		},

		/**
		 * Updates an existing subject record by ID.
		 *
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param subjectId - The unique identifier of the subject to update
		 * @param data - The fields to update on the subject record
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated subject if successful, null if subject not found or hooks prevented update
		 */
		updateUser: async (
			subjectId: string,
			data: Partial<Subject> & Record<string, unknown>,
			context?: GenericEndpointContext
		) => {
			const subject = await updateWithHooks({
				data: {
					...data,
					updatedAt: new Date(),
				},
				where: [
					{
						field: 'id',
						value: subjectId,
					},
				],
				model: 'subject',
				customFn: undefined,
				context,
			});
			return subject
				? validateEntityOutput('subject', subject, ctx.options)
				: null;
		},

		/**
		 * Deletes a subject and all associated consents from the database.
		 *
		 * This is a cascading operation that first removes all consents associated
		 * with the subject, then removes the subject record itself.
		 *
		 * @param subjectId - The unique identifier of the subject to delete
		 * @returns A promise that resolves when the deletion is complete
		 */
		deleteUser: async (subjectId: string) => {
			await adapter.transaction({
				callback: async (tx: Adapter) => {
					// Update the subject record
					await tx.update({
						model: 'subject',
						where: [
							{
								field: 'id',
								value: subjectId,
							},
						],
						update: {
							status: 'deleted',
							updatedAt: new Date(),
						},
					});

					// Delete all related records
					await tx.deleteMany({
						model: 'consent',
						where: [
							{
								field: 'subjectId',
								value: subjectId,
							},
						],
					});
				},
			});
		},
	};
}
