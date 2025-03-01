import type { Adapter } from '~/types';
import type {
	CustomOperationFunction,
	HookContext,
	UpdateWithHooksProps,
} from './types';
import { processHooks, processAfterHooksForMany } from './utils';
import type { ModelName } from '..';

/**
 * Execute custom function if provided
 */
async function executeCustomFunction<
	InputT extends Record<string, unknown>,
	OutputT,
>(
	data: InputT,
	customFn?: CustomOperationFunction<Partial<InputT>, OutputT>
): Promise<{ result: OutputT | null; shouldContinue: boolean }> {
	if (!customFn) {
		return { result: null, shouldContinue: true };
	}

	const result = (await customFn.fn(data as Partial<InputT>)) as OutputT | null;
	const shouldContinue = !result || !!customFn.executeMainFn;

	return { result, shouldContinue };
}

/**
 * Handle adapter updateMany result
 */
function processUpdateManyResult<R extends Record<string, unknown>>(
	result: unknown
): R[] | null {
	if (Array.isArray(result)) {
		return result;
	}

	if (typeof result === 'number' && result > 0) {
		return []; // Empty array if we just got a count
	}

	return null;
}

/**
 * Updates multiple records with hooks applied before and after update
 *
 * @template T - Type of the data being updated
 * @template R - Type of the data returned after update
 * @param adapter - The database adapter to use
 * @param ctx - Context containing hooks and options
 * @param props - Properties for the updateMany operation
 * @returns The updated records or null if a hook aborted the operation
 */
export async function updateManyWithHooks<
	T extends Record<string, unknown> = Record<string, unknown>,
	R extends Record<string, unknown> = T,
>(
	adapter: Adapter,
	ctx: HookContext,
	props: UpdateWithHooksProps<T, R[]>
): Promise<R[] | null> {
	const { data, where, model, customFn, context } = props;
	const hooks = ctx.hooks || [];

	// Process before hooks
	const transformedData = await processHooks<Partial<T>>(
		data,
		model,
		'update',
		'before',
		hooks,
		context
	);
	if (transformedData === null) {
		return null;
	}

	// Try custom function first
	const { result: customResult, shouldContinue } = await executeCustomFunction<
		T,
		R[]
	>(transformedData as T, customFn);

	if (customResult && !shouldContinue) {
		return customResult;
	}

	// Use adapter if needed
	let updated = customResult;
	if (!updated) {
		const adapterResult = await adapter.updateMany({
			model: model as ModelName,
			update: transformedData,
			where,
		});

		updated = processUpdateManyResult<R>(adapterResult);
	}

	// Process after hooks
	if (updated && updated.length > 0) {
		await processAfterHooksForMany<R>(updated, model, hooks, context);
	}

	return updated;
}
