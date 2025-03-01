import type {
	Adapter,
	C15TOptions,
	GenericEndpointContext,
	Where,
} from '~/types';

import { createWithHooks } from './create-hooks';
import { updateWithHooks } from './update-hooks';
import { updateManyWithHooks } from './update-many-hooks';
import type { HookableModels } from './types';

/**
 * Creates a set of functions that apply hooks before and after database operations
 *
 * The hook system allows for transforming data, performing validation,
 * and executing side effects during database operations.
 *
 * @param adapter - The database adapter to use for operations
 * @param ctx - Context object containing options and hooks
 * @returns Object with hook-enabled database operation functions
 *
 * @example
 * ```typescript
 * const { createWithHooks, updateWithHooks } = getWithHooks(adapter, {
 *   options: c15tOptions,
 *   hooks: c15tOptions.databaseHooks || []
 * });
 *
 * // Create a user with hooks
 * const user = await createWithHooks({ name: 'Alice' }, 'user');
 * ```
 */
export function getWithHooks(
	adapter: Adapter,
	ctx: {
		options: C15TOptions;
		hooks: Exclude<C15TOptions['databaseHooks'], undefined>[];
	}
) {
	const hooks = ctx.hooks;

	return {
		/**
		 * Creates a record with hooks applied before and after creation
		 *
		 * @template T - Type of the data being created
		 * @param data - The data to create
		 * @param model - The model to create the record in
		 * @param customCreateFn - Optional custom function to execute
		 * @param context - Optional endpoint context
		 * @returns The created record or null if a hook aborted the operation
		 */
		createWithHooks: <T extends Record<string, unknown>>(
			data: T,
			model: HookableModels,
			customCreateFn?: {
				fn: (data: T) => Promise<T | null> | T | null;
				executeMainFn?: boolean;
			},
			context?: GenericEndpointContext
		) =>
			createWithHooks({
				adapter,
				data,
				model,
				//@ts-expect-error
				hooks,
				customFn: customCreateFn,
				context,
			}),

		/**
		 * Updates a record with hooks applied before and after update
		 *
		 * @template T - Type of the data being updated
		 * @param data - The data to update
		 * @param where - Conditions to identify which record(s) to update
		 * @param model - The model to update the record in
		 * @param customUpdateFn - Optional custom function to execute
		 * @param context - Optional endpoint context
		 * @returns The updated record or null if a hook aborted the operation
		 */
		updateWithHooks: <T extends Record<string, unknown>>(
			data: T,
			where: Where[],
			model: HookableModels,
			customUpdateFn?: {
				fn: (data: T) => Promise<T | null> | T | null;
				executeMainFn?: boolean;
			},
			context?: GenericEndpointContext
		) =>
			updateWithHooks({
				adapter,
				data,
				where,
				model,
				//@ts-expect-error
				hooks,
				customFn: customUpdateFn,
				context,
			}),

		/**
		 * Updates multiple records with hooks applied before and after update
		 *
		 * @template T - Type of the data being updated
		 * @param data - The data to update
		 * @param where - Conditions to identify which records to update
		 * @param model - The model to update the records in
		 * @param customUpdateFn - Optional custom function to execute
		 * @param context - Optional endpoint context
		 * @returns The updated records or null if a hook aborted the operation
		 */
		updateManyWithHooks: <T extends Record<string, unknown>>(
			data: T,
			where: Where[],
			model: HookableModels,
			customUpdateFn?: {
				fn: (data: T) => Promise<T[] | null> | T[] | null;
				executeMainFn?: boolean;
			},
			context?: GenericEndpointContext
		) =>
			updateManyWithHooks({
				adapter,
				data,
				where,
				model,
				//@ts-expect-error
				hooks,
				//@ts-expect-error
				customFn: customUpdateFn,
				context,
			}),
	};
}
