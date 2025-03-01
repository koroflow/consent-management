import type {
	Adapter,
	Where,
	GenericEndpointContext,
	C15TOptions,
} from '~/types';
import type { DatabaseHook, HookResult } from './types';

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

// Common type for hook context without adapter
export interface HookContext {
	hooks: DatabaseHook[];
	options: C15TOptions;
}

// Define the CustomOperationFunction with input and output types
export interface CustomOperationFunction<
	TInput extends Record<string, unknown>,
	TOutput = TInput,
> {
	fn: (data: TInput) => Promise<TOutput | null> | TOutput | null;
	executeMainFn?: boolean;
}

// Unified hook processor that works for all operations
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: its okay
async function processHooks<T extends Record<string, unknown>>(
	data: T,
	model: string,
	operation: 'create' | 'update',
	phase: 'before' | 'after',
	hooks: DatabaseHook[],
	context?: GenericEndpointContext
): Promise<T | null> {
	let currentData = data;

	for (const hook of hooks || []) {
		const hookFn = hook[model as keyof typeof hook]?.[operation]?.[phase];
		if (hookFn) {
			const result = (await hookFn(currentData, context)) as HookResult<T>;

			if (phase === 'before') {
				if (result === false) {
					return null;
				}

				if (typeof result === 'object' && result !== null) {
					currentData = 'data' in result ? (result.data as T) : (result as T);
				}
			}
		}
	}

	return currentData;
}

// Define prop types for each operation
export interface CreateWithHooksProps<T extends Record<string, unknown>> {
	data: T;
	model: string;
	customFn?: CustomOperationFunction<T>;
	context?: GenericEndpointContext;
}

export interface UpdateWithHooksProps<T extends Record<string, unknown>> {
	data: Partial<T>;
	where: Where[];
	model: string;
	customFn?: CustomOperationFunction<Partial<T>>;
	context?: GenericEndpointContext;
}

// Pass adapter and ctx separately, to match your existing pattern
export function getWithHooks(adapter: Adapter, ctx: HookContext) {
	return {
		/**
		 * Creates a record with hooks applied before and after creation
		 *
		 * @template T - Type of the data being created
		 * @param props - Object containing:
		 *   data - The data to create
		 *   model - The model to create the record in
		 *   customFn - Optional custom function to execute
		 *   context - Optional endpoint context
		 * @returns The created record or null if a hook aborted the operation
		 */
		createWithHooks: async <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: CreateWithHooksProps<InputT>
		): Promise<OutputT | null> => {
			const { data, model, customFn, context } = props;

			// Process before hooks
			const transformedData = await processHooks(
				data,
				model,
				'create',
				'before',
				ctx.hooks,
				context
			);
			if (transformedData === null) {
				return null;
			}

			// Execute operation
			let created: OutputT | null = null;
			if (customFn) {
				created = (await customFn.fn(transformedData)) as OutputT | null;
				if (!customFn.executeMainFn && created) {
					return created;
				}
			}

			if (!created) {
				created = await adapter.create<OutputT>({
					model,
					data: transformedData as unknown as OutputT,
				});
			}

			// Process after hooks
			if (created) {
				await processHooks(
					created as unknown as InputT,
					model,
					'create',
					'after',
					ctx.hooks,
					context
				);
			}

			return created;
		},

		/**
		 * Updates a record with hooks applied before and after update
		 *
		 * @template T - Type of the data being updated
		 * @param props - Object containing:
		 *   data - The data to update
		 *   where - Conditions to identify which record(s) to update
		 *   model - The model to update the record in
		 *   customFn - Optional custom function to execute
		 *   context - Optional endpoint context
		 * @returns The updated record or null if a hook aborted the operation
		 */
		updateWithHooks: async <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: UpdateWithHooksProps<InputT>
		): Promise<OutputT | null> => {
			const { data, where, model, customFn, context } = props;

			// Process before hooks (note we're just passing the partial data through)
			const transformedData = await processHooks(
				data as unknown as InputT,
				model,
				'update',
				'before',
				ctx.hooks,
				context
			);
			if (transformedData === null) {
				return null;
			}

			// Execute operation
			let updated: OutputT | null = null;
			if (customFn) {
				updated = (await customFn.fn(
					transformedData as Partial<InputT>
				)) as OutputT | null;
				if (!customFn.executeMainFn && updated) {
					return updated;
				}
			}

			if (!updated) {
				// Key change: Don't assert the partial data as a complete OutputT
				updated = await adapter.update<OutputT>({
					model,
					update: transformedData, // Keep as partial data
					where,
				});
			}

			// Process after hooks
			if (updated) {
				await processHooks(
					updated as unknown as InputT,
					model,
					'update',
					'after',
					ctx.hooks,
					context
				);
			}

			return updated;
		},

		/**
		 * Updates multiple records with hooks applied before and after update
		 *
		 * @template T - Type of the data being updated
		 * @param props - Object containing:
		 *   data - The data to update
		 *   where - Conditions to identify which records to update
		 *   model - The model to update the records in
		 *   customFn - Optional custom function to execute
		 *   context - Optional endpoint context
		 * @returns The updated records or null if a hook aborted the operation
		 */
		updateManyWithHooks: async <
			InputT extends Record<string, unknown>,
			OutputT extends Record<string, unknown> = InputT,
		>(
			props: UpdateWithHooksProps<InputT>
		): Promise<OutputT[] | null> => {
			const { data, where, model, customFn, context } = props;

			// Process before hooks
			const transformedData = await processHooks(
				data as unknown as InputT,
				model,
				'update',
				'before',
				ctx.hooks,
				context
			);
			if (transformedData === null) {
				return null;
			}

			// Execute operation
			let updated: OutputT[] | null = null;
			if (customFn) {
				updated = (await customFn.fn(transformedData as Partial<InputT>)) as
					| OutputT[]
					| null;
				if (!customFn.executeMainFn && updated) {
					return updated;
				}
			}

			if (!updated) {
				const result = await adapter.updateMany({
					model,
					update: transformedData as unknown as OutputT,
					where,
				});

				// Handle different result types
				if (Array.isArray(result)) {
					updated = result as OutputT[];
				} else if (typeof result === 'number' && result > 0) {
					updated = [] as unknown as OutputT[]; // Empty array if we just got a count
				} else {
					updated = null;
				}
			}

			// Process after hooks
			if (updated && updated.length > 0) {
				for (const record of updated) {
					await processHooks(
						record as unknown as InputT,
						model,
						'update',
						'after',
						ctx.hooks,
						context
					);
				}
			}

			return updated;
		},
	};
}
