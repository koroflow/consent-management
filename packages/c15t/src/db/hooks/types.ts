import type { C15TOptions, GenericEndpointContext, Where } from '~/types';
import type { ModelName, ModelTypeMap } from '../core/types';

/**
 * Defines hook execution phases
 */
export type HookPhase = 'before' | 'after';

/**
 * Defines hook operation types
 */
export type HookOperation = 'create' | 'update';

/**
 * Result types for hooks that can control flow
 */
export type HookResult<T> =
	| { kind: 'abort' }
	| { kind: 'transform'; data: T }
	| { kind: 'continue' };

/**
 * Hook function for specific model and operation
 */
export interface ModelHook<M extends ModelName = ModelName> {
	create?: {
		before?: (
			data: ModelTypeMap[M],
			context?: GenericEndpointContext
		) =>
			| Promise<HookResult<ModelTypeMap[M]> | undefined>
			| HookResult<ModelTypeMap[M]>
			| undefined;
		after?: (
			data: ModelTypeMap[M],
			context?: GenericEndpointContext
		) => Promise<void> | void;
	};
	update?: {
		before?: (
			data: Partial<ModelTypeMap[M]>,
			context?: GenericEndpointContext
		) =>
			| Promise<HookResult<Partial<ModelTypeMap[M]>> | undefined>
			| HookResult<Partial<ModelTypeMap[M]>>
			| undefined;
		after?: (
			data: ModelTypeMap[M],
			context?: GenericEndpointContext
		) => Promise<void> | void;
	};
}
/**
 * A collection of hooks for different models
 */
export type DatabaseHook = {
	[M in ModelName]?: ModelHook<M>;
};

/**
 * Context containing options and hooks
 */
export interface HookContext {
	hooks: DatabaseHook[];
	options: C15TOptions;
}

/**
 * Custom function definition for database operations
 */
export interface CustomOperationFunction<
	TInput extends Record<string, unknown> = Record<string, unknown>,
	TOutput = TInput,
> {
	fn: (data: TInput) => Promise<TOutput | null> | TOutput | null;
	executeMainFn?: boolean;
}

/**
 * Properties for creating a record with hooks
 */
export interface CreateWithHooksProps<
	T extends Record<string, unknown> = Record<string, unknown>,
> {
	data: T;
	model: ModelName;
	customFn?: CustomOperationFunction<T>;
	context?: GenericEndpointContext;
}

/**
 * Properties for updating records with hooks
 */
export interface UpdateWithHooksProps<
	T extends Record<string, unknown> = Record<string, unknown>,
	R = T,
> {
	data: Partial<T>;
	where: Where<ModelName>;
	model: ModelName;
	customFn?: CustomOperationFunction<Partial<T>, R>;
	context?: GenericEndpointContext;
}
