import type { Adapter } from '~/types';
import type {
	CreateWithHooksProps,
	HookContext,
	UpdateWithHooksProps,
} from './types';
import { createWithHooks } from './create-hooks';
import { updateWithHooks } from './update-hooks';
import { updateManyWithHooks } from './update-many-hooks';

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
	return {
		createWithHooks: <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: CreateWithHooksProps<InputT>
		) => createWithHooks<InputT, OutputT>(adapter, ctx, props),

		updateWithHooks: <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: UpdateWithHooksProps<InputT, OutputT>
		) => updateWithHooks<InputT, OutputT>(adapter, ctx, props),

		updateManyWithHooks: <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: UpdateWithHooksProps<InputT, OutputT[]>
		) => updateManyWithHooks<InputT, OutputT>(adapter, ctx, props),
	};
}
