/**
 * Represents a string literal type
 *
 * This type ensures that only string literals are accepted, not general string types.
 * It's useful for ensuring type safety with specific string values.
 *
 * @example
 * ```ts
 * // Function that only accepts literal strings, not string variables
 * function doSomething(value: LiteralString) {
 *   // Implementation
 * }
 *
 * // Valid usage:
 * doSomething('specific-value');
 *
 * // Invalid usage:
 * const dynamicString = getStringFromSomewhere();
 * doSomething(dynamicString); // Type error
 * ```
 */
export type LiteralString = '' | (string & Record<never, never>);

/**
 * Extracts all required keys from an object type
 *
 * This utility type identifies which keys in an object type are required
 * (not optional or undefined). Useful for type manipulation in complex types.
 *
 * @typeParam BaseType - The object type to extract required keys from
 *
 * @example
 * ```ts
 * interface User {
 *   id: number;
 *   name: string;
 *   email?: string;
 * }
 *
 * // RequiredKeysOf<User> will be 'id' | 'name'
 * type RequiredUserFields = RequiredKeysOf<User>;
 * ```
 */
export type RequiredKeysOf<BaseType extends object> = Exclude<
	{
		[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
			? Key
			: never;
	}[keyof BaseType],
	undefined
>;

/**
 * Makes all properties in an object type optional recursively
 *
 * Unlike TypeScript's built-in Partial<T>, this type makes nested object
 * properties optional as well. Functions are preserved as-is.
 *
 * @typeParam T - The type to make deeply partial
 *
 * @example
 * ```ts
 * interface User {
 *   id: number;
 *   name: string;
 *   settings: {
 *     theme: string;
 *     notifications: boolean;
 *   }
 * }
 *
 * // All properties including nested ones are optional
 * const partialUser: DeepPartial<User> = {
 *   name: 'John',
 *   settings: {
 *     theme: 'dark'
 *     // notifications can be omitted
 *   }
 * };
 * ```
 */
export type DeepPartial<T> = T extends (...args: unknown[]) => unknown
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T;

/**
 * Recursively expands object types for better IntelliSense
 *
 * This utility improves type display in editors by expanding nested type
 * definitions. Particularly useful when working with complex types
 * created through composition or manipulation.
 *
 * @typeParam T - The type to expand recursively
 *
 * @example
 * ```ts
 * // Before expansion: Intersection of multiple types
 * type ComplexType = TypeA & TypeB & { extraProp: string };
 *
 * // After expansion: Flat object type with all properties visible
 * type ExpandedType = ExpandRecursively<ComplexType>;
 * ```
 */
export type ExpandRecursively<T> = T extends infer O
	? { [K in keyof O]: O[K] }
	: never;
