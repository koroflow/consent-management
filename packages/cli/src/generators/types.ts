import type { Adapter, C15TOptions } from '@c15t/backend/types';

export type SchemaGenerator = (opts: {
	file?: string;
	adapter: Adapter;
	options: C15TOptions;
}) => Promise<{
	code?: string;
	fileName: string;
	overwrite?: boolean;
	append?: boolean;
}>;
