import type {
	CreateHookParams,
	HookResult,
	DatabaseHook,
	CustomOperationFunction,
} from './types';
import type { Adapter, GenericEndpointContext } from '~/types';

/**
 * Processes data through 'before' hooks
 *
 * @template T - Type of the data being created
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
	context?: GenericEndpointContext
): Promise<T | null> {
	let currentData = data;

	for (const hook of hooks || []) {
		const beforeHook = hook[model as keyof typeof hook]?.create?.before;
		if (beforeHook) {
			const result = (await beforeHook(currentData, context)) as HookResult<T>;

			// If a hook returns false, abort the operation
			if (result === false) {
				return null;
			}

			// If a hook returns an object with a data property, update the data
			if (typeof result === 'object' && result !== null && 'data' in result) {
				currentData = {
					...currentData,
					...(result.data as T),
				};
			}
		}
	}

	return currentData;
}

/**
 * Executes the create operation using adapter or custom function
 *
 * @template T - Type of the data being created
 * @param adapter - Database adapter
 * @param model - Model to create
 * @param data - Data to create
 * @param customFn - Optional custom function
 * @returns Created record or null
 */
async function executeCreate<T extends Record<string, unknown>>(
	adapter: Adapter,
	model: string,
	data: T,
	customFn?: CustomOperationFunction<T>
): Promise<T | null> {
	// Execute the custom function if provided
	const customCreated = customFn ? await customFn.fn(data) : null;

	// Execute the main adapter create if needed
	if (!customFn || customFn.executeMainFn) {
		return await adapter.create<T>({
			model,
			data,
		});
	}

	return customCreated as T | null;
}

/**
 * Executes after hooks with created record
 *
 * @template T - Type of the created data
 * @param created - The created record
 * @param model - The model operated on
 * @param hooks - Collection of hooks to apply
 * @param context - Optional endpoint context
 */
async function processAfterHooks<T extends Record<string, unknown>>(
	created: T,
	model: string,
	hooks: DatabaseHook[],
	context?: GenericEndpointContext
): Promise<void> {
	for (const hook of hooks || []) {
		const afterHook = hook[model as keyof typeof hook]?.create?.after;
		if (afterHook) {
			await afterHook(created, context);
		}
	}
}

/**
 * Executes a database create operation with before and after hooks
 *
 * This function:
 * 1. Runs all 'before' hooks, allowing data transformation
 * 2. Either executes a custom create function, the main adapter create, or both
 * 3. Runs all 'after' hooks with the created data
 *
 * @template T - Type of the data being created
 * @param params - Parameters for the create operation
 * @returns The created record or null if a hook aborted the operation
 */
export async function createWithHooks<T extends Record<string, unknown>>({
	adapter,
	data,
	model,
	hooks,
	customFn,
	context,
}: CreateHookParams<T>): Promise<T | null> {
	// Process before hooks
	const transformedData = await processBeforeHooks(data, model, hooks, context);
	if (transformedData === null) {
		return null;
	}

	// Execute create operation
	const created = await executeCreate(
		adapter,
		model,
		transformedData,
		customFn
	);

	// Process after hooks if creation succeeded
	if (created) {
		await processAfterHooks(created, model, hooks, context);
	}

	return created;
}
