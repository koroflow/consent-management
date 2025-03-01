//@ts-nocheck

import type {
	Adapter,
	C15TOptions,
	GenericEndpointContext,
	Models,
	Where,
} from '~/types';

export function getWithHooks(
	adapter: Adapter,
	ctx: {
		options: C15TOptions;
		hooks: Exclude<C15TOptions['databaseHooks'], undefined>[];
	}
) {
	const hooks = ctx.hooks;
	type BaseModels = Extract<
		Models,
		'user' | 'account' | 'session' | 'verification'
	>;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	async function createWithHooks<T extends Record<string, any>>(
		data: T,
		model: BaseModels,
		customCreateFn?: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
      			fn: (data: Record<string, any>) => void | Promise<any>;
			executeMainFn?: boolean;
		},
		context?: GenericEndpointContext
	) {
		let actualData = data;
		for (const hook of hooks || []) {
			const toRun = hook[model]?.create?.before;
			if (toRun) {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const result = await toRun(actualData as any, context);
				if (result === false) {
					return null;
				}
				const isObject = typeof result === 'object' && 'data' in result;
				if (isObject) {
					actualData = {
						...actualData,
						...result.data,
					};
				}
			}
		}

		const customCreated = customCreateFn
			? await customCreateFn.fn(actualData)
			: null;
		const created =
			!customCreateFn || customCreateFn.executeMainFn
				? await adapter.create<T>({
						model,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
						data: actualData as any,
					})
				: customCreated;

		for (const hook of hooks || []) {
			const toRun = hook[model]?.create?.after;
			if (toRun) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				await toRun(created as any, context);
			}
		}

		return created;
	}

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
  	async function updateWithHooks<T extends Record<string, any>>(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
		data: any,
		where: Where[],
		model: BaseModels,
		customUpdateFn?: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
      			fn: (data: Record<string, any>) => void | Promise<any>;
			executeMainFn?: boolean;
		},
		context?: GenericEndpointContext
	) {
		let actualData = data;

		for (const hook of hooks || []) {
			const toRun = hook[model]?.update?.before;
			if (toRun) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const result = await toRun(data as any, context);
				if (result === false) {
					return null;
				}
				const isObject = typeof result === 'object';
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				actualData = isObject ? (result as any).data : result;
			}
		}

		const customUpdated = customUpdateFn
			? await customUpdateFn.fn(actualData)
			: null;

		const updated =
			!customUpdateFn || customUpdateFn.executeMainFn
				? await adapter.update<T>({
						model,
						update: actualData,
						where,
					})
				: customUpdated;

		for (const hook of hooks || []) {
			const toRun = hook[model]?.update?.after;
			if (toRun) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				await toRun(updated as any, context);
			}
		}
		return updated;
	}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
	async function updateManyWithHooks<T extends Record<string, any>>(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		data: any,
		where: Where[],
		model: BaseModels,
		customUpdateFn?: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
			// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
      			fn: (data: Record<string, any>) => void | Promise<any>;
			executeMainFn?: boolean;
		},
		context?: GenericEndpointContext
	) {
		let actualData = data;

		for (const hook of hooks || []) {
			const toRun = hook[model]?.update?.before;
			if (toRun) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const result = await toRun(data as any, context);
				if (result === false) {
					return null;
				}
				const isObject = typeof result === 'object';
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
				actualData = isObject ? (result as any).data : result;
			}
		}

		const customUpdated = customUpdateFn
			? await customUpdateFn.fn(actualData)
			: null;

		const updated =
			!customUpdateFn || customUpdateFn.executeMainFn
				? await adapter.updateMany({
						model,
						update: actualData,
						where,
					})
				: customUpdated;

		for (const hook of hooks || []) {
      //@ts-expect-error
			const toRun = hook[model]?.update?.after;
			if (toRun) {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				await toRun(updated as any, context);
			}
		}

		return updated;
	}
	return {
		createWithHooks,
		updateWithHooks,
		updateManyWithHooks,
	};
}
