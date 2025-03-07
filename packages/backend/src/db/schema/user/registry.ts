import type { GenericEndpointContext, RegistryContext } from '~/types';
import type { User } from './schema';
import { getWithHooks } from '~/db/hooks';
import { validateEntityOutput } from '../definition';
import { APIError } from '~/api';

export interface FindOrCreateUserParams {
	userId?: string;
	externalUserId?: string;
	ipAddress?: string;
	context?: GenericEndpointContext;
}

/**
 * Creates and returns a set of user-related adapter methods to interact with the database.
 *
 * These methods provide a consistent interface for creating, finding, updating, and deleting
 * user records while applying hooks and enforcing data validation rules.
 *
 * @param adapter - The database adapter used for direct database operations
 * @param ctx - The context object containing the database adapter, hooks, and options
 * @returns An object containing type-safe user operations
 *
 * @example
 * ```typescript
 * const userAdapter = createUserAdapter(
 *   databaseAdapter,
 *   createWithHooks,
 *   updateWithHooks,
 *   c15tOptions
 * );
 *
 * // Create a new user
 * const user = await userAdapter.createUser({
 *   externalId: 'external-123',
 *   identityProvider: 'auth0'
 * });
 * ```
 */
export function userRegistry({ adapter, ...ctx }: RegistryContext) {
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);

	return {
		/**
		 * Creates a new user record in the database.
		 *
		 * Automatically sets creation and update timestamps and applies any
		 * configured hooks during the creation process.
		 *
		 * @param user - User data to create (without id and timestamps)
		 * @param context - Optional endpoint context for hooks
		 * @returns The created user with all fields populated
		 *
		 * @throws May throw an error if hooks prevent creation or if database operations fail
		 */
		createUser: async (
			user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & Partial<User>,
			context?: GenericEndpointContext
		) => {
			const createdUser = await createWithHooks({
				data: {
					createdAt: new Date(),
					updatedAt: new Date(),
					...user,
				},
				model: 'user',
				customFn: undefined,
				context,
			});
			return createdUser
				? validateEntityOutput('user', createdUser, ctx.options)
				: null;
		},

		/**
		 * Finds an existing user or creates a new one if needed.
		 * If both userId and externalUserId are provided, validates they match the same user.
		 * Creates a new anonymous user only if no identifiers are provided.
		 *
		 * @param params - Parameters for finding or creating the user
		 * @returns The existing or newly created user
		 * @throws APIError if user validation fails or creation fails
		 */
		findOrCreateUser: async function ({
			userId,
			externalUserId,
			ipAddress = 'unknown',
			context,
		}: FindOrCreateUserParams) {
			// If both userId and externalUserId are provided, validate they match
			if (userId && externalUserId) {
				const [userById, userByExternalId] = await Promise.all([
					this.findUserById(userId),
					this.findUserByExternalId(externalUserId),
				]);

				if (!userById || !userByExternalId) {
					throw new APIError('NOT_FOUND', {
						message: 'One or both users not found',
						status: 404,
					});
				}

				if (userById.id !== userByExternalId.id) {
					throw new APIError('BAD_REQUEST', {
						message: 'Provided userId and externalUserId do not match the same user',
						status: 400,
					});
				}

				return userById;
			}

			// Try to find user by userId if provided
			if (userId) {
				const user = await this.findUserById(userId);
				if (user) {
					return user;
				}
				throw new APIError('NOT_FOUND', {
					message: 'User not found',
					status: 404,
				});
			}

			// If externalUserId provided, try to find or create with upsert
			if (externalUserId) {
				try {
					const user = await this.findUserByExternalId(externalUserId);
					if (user) {
						return user;
					}
					
					// Attempt to create with unique constraint on externalId
					return await this.createUser(
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
					if (error instanceof Error && error.message.includes('unique constraint')) {
						const user = await this.findUserByExternalId(externalUserId);
						if (user) {
							return user;
						}
					}
					throw new APIError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create or find user with external ID',
						status: 503,
						details: error instanceof Error ? error.message : 'Unknown error',
					});
				}
			}

			// For anonymous users, use a transaction to prevent duplicates
			try {
				ctx.logger?.info('Creating new anonymous user');
				return await this.createUser(
					{
						externalId: null,
						identityProvider: 'anonymous',
						lastIpAddress: ipAddress,
						isIdentified: false,
					},
					context
				);
			} catch (error) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to create anonymous user',
					status: 503,
					details: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		},

		/**
		 * Finds a user by their unique ID.
		 *
		 * Returns the user with processed output fields according to the schema configuration.
		 *
		 * @param userId - The unique identifier of the user
		 * @returns The user object if found, null otherwise
		 */
		findUserById: async (userId: string) => {
			const user = await adapter.findOne({
				model: 'user',
				where: [
					{
						field: 'id',
						value: userId,
					},
				],
			});
			return user ? validateEntityOutput('user', user, ctx.options) : null;
		},

		/**
		 * Finds a user by their external ID.
		 *
		 * This is useful when integrating with external authentication systems
		 * where users are identified by a provider-specific ID.
		 *
		 * @param externalId - The external identifier of the user
		 * @returns The user object if found, null otherwise
		 */
		findUserByExternalId: async (externalId: string) => {
			const user = await adapter.findOne({
				model: 'user',
				where: [
					{
						field: 'externalId',
						value: externalId,
					},
				],
			});
			return user ? validateEntityOutput('user', user, ctx.options) : null;
		},

		/**
		 * Updates an existing user record by ID.
		 *
		 * Applies any configured hooks during the update process and
		 * processes the output according to schema configuration.
		 *
		 * @param userId - The unique identifier of the user to update
		 * @param data - The fields to update on the user record
		 * @param context - Optional endpoint context for hooks
		 * @returns The updated user if successful, null if user not found or hooks prevented update
		 */
		updateUser: async (
			userId: string,
			data: Partial<User> & Record<string, unknown>,
			context?: GenericEndpointContext
		) => {
			const user = await updateWithHooks({
				data: {
					...data,
					updatedAt: new Date(),
				},
				where: [
					{
						field: 'id',
						value: userId,
					},
				],
				model: 'user',
				customFn: undefined,
				context,
			});
			return user ? validateEntityOutput('user', user, ctx.options) : null;
		},

		/**
		 * Deletes a user and all associated consents from the database.
		 *
		 * This is a cascading operation that first removes all consents associated
		 * with the user, then removes the user record itself.
		 *
		 * @param userId - The unique identifier of the user to delete
		 * @returns A promise that resolves when the deletion is complete
		 */
		deleteUser: async (userId: string) => {
			// Delete all consents associated with the user
			await adapter.deleteMany({
				model: 'consent',
				where: [
					{
						field: 'userId',
						value: userId,
					},
				],
			});

			// Delete the user
			await adapter.delete({
				model: 'user',
				where: [
					{
						field: 'id',
						value: userId,
					},
				],
			});
		},
	};
}
