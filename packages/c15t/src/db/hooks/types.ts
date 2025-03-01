import type {
	Adapter,
	C15TOptions,
	GenericEndpointContext,
	Where,
} from '~/types';

export type Models =
	| 'consent'
	| 'consentPurpose'
	| 'consentRecord'
	| 'consentGeoLocation'
	| 'consentWithdrawal'
	| 'consentAuditLog'
	| 'consentPolicy'
	| 'domain';

/**
 * Models that can have hooks applied to them
 */
export type HookableModels = Extract<
	Models,
	'user' | 'account' | 'session' | 'verification'
>;

/**
 * Structure for hook functions
 */
export type HookFunction<T, R = unknown> = (
	data: T,
	context?: GenericEndpointContext
) => Promise<R> | R;

/**
 * Structure for operation hooks (before/after)
 */
export interface OperationHooks<T> {
	before?: HookFunction<T, HookResult<T>>;
	after?: HookFunction<T>;
}

/**
 * Structure for model operations
 */
export interface ModelOperations<T> {
	create?: OperationHooks<T>;
	update?: OperationHooks<T>;
}

/**
 * Complete definition of a database hook
 * This ensures each hookable model has its own property
 */
export type DatabaseHook = {
	[M in HookableModels]?: ModelOperations<Record<string, unknown>>;
};

/**
 * Context object for hook operations
 */
export interface HookContext {
	options: C15TOptions;
	hooks: DatabaseHook[];
}

/**
 * Result of running a hook
 * Hooks can return:
 * - false to abort the operation
 * - an object with a data property to transform the data
 * - any other value to continue with the original data
 */
export type HookResult<T> = false | { data: T } | unknown;

/**
 * Custom function that can replace or augment the default operation
 */
export interface CustomOperationFunction<T extends Record<string, unknown>> {
	/**
	 * Function to execute instead of or along with the main operation
	 * @param data - The data after processing by 'before' hooks
	 * @returns The operation result or void
	 */
	fn: (data: T) => Promise<T | null> | T | null;

	/**
	 * Whether to execute the main operation after this function
	 * If true, both custom and main operation will run
	 * If false, only the custom function will run
	 */
	executeMainFn?: boolean;
}

/**
 * Parameters for hook-enabled operations
 */
export interface HookOperationParams<T extends Record<string, unknown>> {
	adapter: Adapter;
	model: HookableModels;
	hooks: DatabaseHook[];
	context?: GenericEndpointContext;
}

/**
 * Parameters for update operations with hooks
 */
export interface UpdateHookParams<T extends Record<string, unknown>>
	extends HookOperationParams<T> {
	data: T;
	where: Where[];
	customFn?: CustomOperationFunction<T>;
}

/**
 * Parameters for create operations with hooks
 */
export interface CreateHookParams<T extends Record<string, unknown>>
	extends HookOperationParams<T> {
	data: T;
	customFn?: CustomOperationFunction<T>;
}

/**
 * Type for the createWithHooks function that handles record creation with pre/post hooks
 */
export type CreateWithHooks = <T extends Record<string, unknown>>(
	data: T,
	model: string,
	customFn?: CustomOperationFunction<T>,
	context?: GenericEndpointContext
) => Promise<T | null>;

/**
 * Type for the updateWithHooks function that handles record updates with pre/post hooks
 */
export type UpdateWithHooks = <T extends Record<string, unknown>>(
	data: Partial<T>,
	where: Where[],
	model: string,
	customFn?: CustomOperationFunction<T>,
	context?: GenericEndpointContext
) => Promise<T | null>;
