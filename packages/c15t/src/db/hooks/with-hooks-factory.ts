import type { Adapter, C15TOptions } from '~/types';
import { createWithHooks as create } from './create-hooks';
import { updateWithHooks as update } from './update-hooks';
import { updateManyWithHooks as updateMany } from './update-many-hooks';
import type { CreateHookParams, DatabaseHook, UpdateHookParams } from './types';

export type HookContext = {
	options: C15TOptions;
	hooks: DatabaseHook[];
};

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
export function getWithHooks(adapter: Adapter, ctx: HookContext) {
	// Add common properties to all hook operations
	const commonProps = {
		adapter,
		hooks: ctx.hooks,
	};

	// Create wrapper functions with shared context
	return {
		/**
		 * Creates a record with hooks applied before and after creation
		 *
		 * @template T - Type of the data being created
		 * @param params - Object containing:
		 *   data - The data to create
		 *   model - The model to create the record in
		 *   customFn - Optional custom function to execute
		 *   context - Optional endpoint context
		 * @returns The created record or null if a hook aborted the operation
		 */
		createWithHooks: <T extends Record<string, unknown>>(
			params: Omit<CreateHookParams<T>, 'adapter' | 'hooks'>
		) => create({ ...params, ...commonProps }),

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
			params: Omit<UpdateHookParams<T>, 'adapter' | 'hooks'>
		) => update({ ...params, ...commonProps }),

		/**
		 * Updates multiple records with hooks applied before and after update
		 *
		 * @template T - Type of the data being updated
		 * @param params - Parameters for updating multiple records
		 * @param params.data - The data to update
		 * @param params.where - Conditions to identify which records to update
		 * @param params.model - The model to update the records in
		 * @param params.customUpdateFn - Optional custom function to execute
		 * @param params.context - Optional endpoint context
		 * @returns The updated records or null if a hook aborted the operation
		 */
		updateManyWithHooks: <T extends Record<string, unknown>>(
			params: Omit<UpdateHookParams<T>, 'adapter' | 'hooks'>
		) => updateMany({ ...params, ...commonProps }),
	};
}
