import type { GenericEndpointContext } from '~/types';
import type { DatabaseHook, HookOperation, HookPhase } from './types';
import type { ModelName } from '../core/types';

/**
 * Helper to process a single hook result
 */
export function handleHookResult<T extends Record<string, unknown>>(
	currentData: T,
	result: unknown
): { data: T; abort: boolean } {
	if (result && typeof result === 'object' && 'kind' in result) {
		switch (result.kind) {
			case 'abort':
				return { data: currentData, abort: true };
			case 'transform':
				return {
					data: {
						...currentData,
						...(result as { kind: 'transform'; data: T }).data,
					} as T,
					abort: false,
				};
			default:
				// All other cases (including 'continue') just continue with unchanged data
				return { data: currentData, abort: false };
		}
	}
	// For non-object results or those without a 'kind' property
	return { data: currentData, abort: false };
}

/**
 * Process hooks for a given phase and operation
 */

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is a complex function but it's ok
export async function processHooks<T extends Record<string, unknown>>(
	data: T,
	model: ModelName,
	operation: HookOperation,
	phase: HookPhase,
	hooks: DatabaseHook[],
	context?: GenericEndpointContext
): Promise<T | null> {
	let currentData = { ...data };

	for (const hookSet of hooks) {
		// Skip if no hooks for this model
		const modelHooks = hookSet[model];
		if (!modelHooks) {
			continue;
		}

		// Skip if no hooks for this operation
		const operationHooks = modelHooks[operation];
		if (!operationHooks) {
			continue;
		}

		// Skip if no hooks for this phase
		const hookFn = operationHooks[phase];
		if (!hookFn) {
			continue;
		}

		if (phase === 'before') {
			const result = await hookFn(currentData as any, context);

			if (result && typeof result === 'object' && 'kind' in result) {
				switch (result.kind) {
					case 'abort':
						return null;
					case 'transform': {
						// Type assertion only for the nested property access
						const transformData = result.data;
						currentData = {
							...currentData,
							...transformData,
						};
						break;
					}
					default:
						// Continue with current data
						break;
				}
			}
		} else {
			// For 'after' hooks, just execute the hook
			await hookFn(currentData as any, context);
		}
	}

	return currentData;
}

/**
 * Process hooks for multiple records
 */
export async function processAfterHooksForMany<
	T extends Record<string, unknown>,
>(
	records: T[],
	model: ModelName,
	hooks: DatabaseHook[],
	context?: GenericEndpointContext
): Promise<void> {
	if (!records.length) {
		return;
	}

	for (const record of records) {
		await processHooks<T>(record, model, 'update', 'after', hooks, context);
	}
}
