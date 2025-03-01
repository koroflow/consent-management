import type { Adapter } from '~/types';
import type { CreateWithHooksProps, HookContext } from './types';
import { processHooks } from './utils';

/**
 * Creates a record with hooks applied before and after creation
 *
 * @template T - Type of the data being created
 * @template R - Type of the data returned after creation
 * @param adapter - The database adapter to use
 * @param ctx - Context containing hooks and options
 * @param props - Properties for the create operation
 * @returns The created record or null if a hook aborted the operation
 */
export async function createWithHooks<
	T extends Record<string, unknown> = Record<string, unknown>,
	R extends Record<string, unknown> = T,
>(
	adapter: Adapter,
	ctx: HookContext,
	props: CreateWithHooksProps<T>
): Promise<R | null> {
	const { data, model, customFn, context } = props;
	const hooks = ctx.hooks || [];

	// Process before hooks
	const transformedData = await processHooks<T>(
		data,
		model,
		'create',
		'before',
		hooks,
		context
	);
	if (transformedData === null) {
		return null;
	}

	// Execute operation
	let created: R | null = null;
	if (customFn) {
		created = (await customFn.fn(transformedData)) as R | null;
		if (!customFn.executeMainFn && created) {
			return created;
		}
	}

	if (!created) {
		created = await adapter.create<R>({
			model,
			data: transformedData as unknown as R,
		});
	}

	// Process after hooks
	if (created) {
		await processHooks<R>(created, model, 'create', 'after', hooks, context);
	}

	return created;
}
