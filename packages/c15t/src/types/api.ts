/**
 * Filter action methods from an object type
 *
 * This type utility extracts only the method properties from an object type,
 * useful for API type inference.
 */
export type FilterActions<T> = {
	[K in keyof T as T[K] extends (...args: unknown[]) => unknown
		? K
		: never]: T[K];
};

/**
 * Infer the return type of an API function
 *
 * This type utility extracts the return type of a function,
 * useful for API type inference.
 */
export type InferAPI<T> = T extends (...args: unknown[]) => infer R ? R : never;
