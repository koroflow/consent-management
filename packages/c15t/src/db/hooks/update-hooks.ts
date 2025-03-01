import type { Adapter } from '~/types';
import type { HookContext, UpdateWithHooksProps } from './types';
import { processHooks } from './utils';
import type { ModelName } from '..';

/**
 * Updates a record with hooks applied before and after update
 *
 * @template InputT - Type of the data being updated
 * @template OutputT - Type of the data returned after update
 * @param adapter - The database adapter to use
 * @param ctx - Context containing hooks and options
 * @param props - Properties for the update operation
 * @returns The updated record or null if a hook aborted the operation
 */
export async function updateWithHooks<
	T extends Record<string, unknown> = Record<string, unknown>,
	R extends Record<string, unknown> = T,
>(
	adapter: Adapter,
	ctx: HookContext,
	props: UpdateWithHooksProps<T, R>
): Promise<R | null> {
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

	// Execute operation
	let updated: R | null = null;
	if (customFn) {
		const result = await customFn.fn(transformedData);
		updated = result as R | null;
		if (!customFn.executeMainFn && updated) {
			return updated;
		}
	}

	if (!updated) {
		updated = await adapter.update<R>({
			model: model as ModelName,
			update: transformedData,
			where,
		});
	}

	// Process after hooks
	if (updated) {
		await processHooks<R>(updated, model, 'update', 'after', hooks, context);
	}

	return updated;
}
