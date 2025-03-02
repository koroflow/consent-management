export type LiteralString = '' | (string & Record<never, never>);

export type RequiredKeysOf<BaseType extends object> = Exclude<
	{
		[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
			? Key
			: never;
	}[keyof BaseType],
	undefined
>;

export type DeepPartial<T> = T extends (...args: unknown[]) => unknown
	? T
	: T extends object
		? { [K in keyof T]?: DeepPartial<T[K]> }
		: T;

export type ExpandRecursively<T> = T extends infer O
	? { [K in keyof O]: O[K] }
	: never;
