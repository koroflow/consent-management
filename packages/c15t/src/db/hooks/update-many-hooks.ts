import type { Adapter, Where, GenericEndpointContext } from '~/types';
import type {
	UpdateHookParams,
	HookResult,
	DatabaseHook,
	CustomOperationFunction,
} from './types';

/**
 * Processes data through 'before' hooks
 *
 * @template T - Type of the data being updated
 * @param data - The data to transform
 * @param model - The model being operated on
 * @param hooks - Collection of hooks to apply
 * @param context - Optional endpoint context
 * @returns Transformed data or null if operation should abort
 */
async function processBeforeHooks<T extends Record<string, unknown>>(
	data: T,
	model: string,
	hooks: DatabaseHook[],
	context?: unknown
) {
	let currentData = data;

	for (const hook of hooks || []) {
		const beforeHook = hook[model as keyof typeof hook]?.update?.before;
		if (beforeHook) {
			const result = (await beforeHook(
				currentData,
				context as GenericEndpointContext
			)) as HookResult<T>;

			// If a hook returns false, abort the operation
			if (result === false) {
				return null;
			}

			// If a hook returns an object, extract the data property
			if (typeof result === 'object' && result !== null) {
				currentData = 'data' in result ? (result.data as T) : (result as T);
			}
		}
	}

	return currentData;
}

/**
 * Executes after hooks with updated records
 *
 * @template T - Type of the data that was updated
 * @param updated - The updated records
 * @param model - The model that was operated on
 * @param hooks - Collection of hooks to apply
 * @param context - Optional endpoint context
 */
async function processAfterHooks<T extends Record<string, unknown>>(
	updated: T[],
	model: string,
	hooks: DatabaseHook[],
	context?: unknown
) {
	for (const hook of hooks || []) {
		const afterHook = hook[model as keyof typeof hook]?.update?.after;
		if (afterHook) {
			// Process each record individually through the after hook
			for (const record of updated) {
				await afterHook(record, context as GenericEndpointContext);
			}
		}
	}
}

/**
 * Executes the actual update operation using the adapter or custom function
 *
 * @template T - Type of the data being updated
 * @param adapter - Database adapter
 * @param model - Model to update
 * @param data - Data for the update
 * @param where - Query conditions
 * @param customFn - Optional custom function
 * @returns Updated records or null
 */
async function executeUpdate<T extends Record<string, unknown>>(
	adapter: Adapter,
	model: string,
	data: T,
	where: Where[],
	customFn?: CustomOperationFunction<T>
) {
	// Use custom function if provided
	const customResult = customFn ? await customFn.fn(data) : null;

	// Return early if using only custom function
	if (customFn && !customFn.executeMainFn) {
		return Array.isArray(customResult) ? (customResult as T[]) : null;
	}

	// Otherwise use adapter
	const result = await adapter.updateMany({
		model,
		update: data,
		where,
	});

	// Handle different result types
	if (Array.isArray(result)) {
		return result as T[];
	}

	return typeof result === 'number' && result > 0 ? ([] as T[]) : null;
}

/**
 * Executes a database updateMany operation with before and after hooks
 *
 * This function:
 * 1. Runs all 'before' hooks, allowing data transformation
 * 2. Either executes a custom update function, the main adapter updateMany, or both
 * 3. Runs all 'after' hooks with the updated data
 *
 * Note: This uses the same 'before' hooks as single update operations
 *
 * @template T - Type of the data being updated
 * @param params - Parameters for the updateMany operation including:
 *                 adapter - Database adapter
 *                 data - Data to update
 *                 where - Query conditions
 *                 model - Model to update
 *                 hooks - Database hooks to run
 *                 customFn - Optional custom function
 *                 context - Optional endpoint context
 * @returns Array of updated records or null if a hook aborted the operation
 */
export async function updateManyWithHooks<T extends Record<string, unknown>>({
	adapter,
	data,
	where,
	model,
	hooks,
	customFn,
	context,
}: UpdateHookParams<T>) {
	// Process before hooks
	const transformedData = await processBeforeHooks(data, model, hooks, context);
	if (transformedData === null) {
		return null;
	}

	// Execute update operation
	const updated = await executeUpdate(
		adapter,
		model,
		transformedData,
		where,
		customFn
	);

	// Run after hooks if we have results
	if (updated && updated.length > 0) {
		await processAfterHooks(updated, model, hooks, context);
	}

	return updated;
}
