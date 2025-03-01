import type {
	UpdateHookParams,
	HookResult,
	DatabaseHook,
	CustomOperationFunction,
} from './types';
import type { Adapter, GenericEndpointContext, Where } from '~/types';

/**
 * Processes data through update 'before' hooks
 *
 * This function runs each 'before' hook on the input data, allowing hooks to:
 * - Transform the data before the update operation
 * - Validate the data and abort the operation by returning false
 * - Add additional fields to the data
 *
 * @template T - Type of the data being updated
 * @param data - The original data to transform
 * @param model - The database model being operated on
 * @param hooks - Collection of database hooks to apply
 * @param context - Optional context object passed to hooks
 * @returns The transformed data or null if a hook aborted the operation
 */
async function processBeforeHooks<T extends Record<string, unknown>>(
	data: T,
	model: string,
	hooks: DatabaseHook[],
	context?: GenericEndpointContext
) {
	// Start with the original data
	let currentData = data;

	// Process each hook in sequence
	for (const hook of hooks || []) {
		// Access the 'before' hook for this model's update operation
		const beforeHook = hook[model as keyof typeof hook]?.update?.before;
		if (beforeHook) {
			// Execute the before hook with current data
			const result = (await beforeHook(currentData, context)) as HookResult<T>;
			// Hook can abort the operation by returning false
			if (result === false) {
				return null;
			}

			// If hook returned an object, use it to update the data
			if (typeof result === 'object' && result !== null) {
				// Some hooks return {data: T}, others return the data directly
				currentData = 'data' in result ? (result.data as T) : (result as T);
			}
		}
	}
	return currentData;
}

/**
 * Executes the update operation using adapter or custom function
 *
 * Handles the logic of choosing between:
 * - Using a custom update function only
 * - Using the main adapter update only
 * - Using both (custom function first, then adapter)
 *
 * @template T - Type of the data being updated
 * @param adapter - Database adapter for performing updates
 * @param model - Model name to update
 * @param data - Data after transformation by 'before' hooks
 * @param where - Query conditions to identify records to update
 * @param customFn - Optional custom function to perform updates
 * @returns The updated record or null if nothing was updated
 */
async function executeUpdate<T extends Record<string, unknown>>(
	adapter: Adapter,
	model: string,
	data: T,
	where: Where[],
	customFn?: CustomOperationFunction<T>
) {
	// Run custom function if provided
	const customUpdated = customFn ? await customFn.fn(data) : null;

	// If custom function should be used exclusively, return its result
	if (customFn && !customFn.executeMainFn) {
		return customUpdated as T | null;
	}

	// Otherwise use the adapter to perform the update
	return await adapter.update<T>({
		model,
		update: data,
		where,
	});
}

/**
 * Executes a database update operation with lifecycle hooks
 *
 * This function provides a complete hook system for update operations:
 * 1. Runs 'before' hooks to transform/validate data
 * 2. Performs the update operation (custom and/or adapter)
 * 3. Runs 'after' hooks to process the results or perform side effects
 *
 * @template T - Type of the data being updated
 * @param params - Update operation parameters including:
 *                adapter - Database adapter
 *                data - Data to update
 *                where - Query conditions
 *                model - Model to update
 *                hooks - Lifecycle hooks
 *                customFn - Optional custom update function
 *                context - Context passed to hooks
 * @returns The updated record or null if update failed/was aborted
 * @example
 * ```typescript
 * const result = await updateWithHooks({
 *   adapter,
 *   data: { name: 'Updated Name' },
 *   where: [{ field: 'id', operator: '=', value: '123' }],
 *   model: 'user',
 *   hooks: config.databaseHooks,
 *   context: { req, res }
 * });
 * ```
 */
export async function updateWithHooks<T extends Record<string, unknown>>({
	adapter,
	data,
	where,
	model,
	hooks,
	customFn,
	context,
}: UpdateHookParams<T>) {
	// Step 1: Run 'before' hooks to transform/validate data
	const transformedData = await processBeforeHooks(data, model, hooks, context);
	// If a hook aborted the operation, exit early
	if (transformedData === null) {
		return null;
	}

	// Step 2: Execute the actual update operation
	const updated = await executeUpdate(
		adapter,
		model,
		transformedData,
		where,
		customFn
	);

	// Step 3: Run 'after' hooks if update succeeded
	if (updated) {
		// Process each hook in sequence
		for (const hook of hooks || []) {
			// Access the 'after' hook for this model's update operation
			const afterHook = hook[model as keyof typeof hook]?.update?.after;
			// Execute the after hook with the updated record
			if (afterHook) {
				await afterHook(updated, context);
			}
		}
	}

	return updated;
}
