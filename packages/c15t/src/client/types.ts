// client/types.ts
export interface C15tClientOptions {
	/**
	 * Base URL for API endpoints
	 */
	baseURL: string;

	/**
	 * Default request headers
	 */
	headers?: Record<string, string>;

	/**
	 * Additional fetch options
	 */
	fetchOptions?: {
		/**
		 * Custom fetch implementation
		 */
		customFetchImpl?: typeof fetch;
	};

	/**
	 * Client plugins
	 */
	plugins?: Array<C15tClientPlugin>;
}

export interface FetchOptions<T = any> {
	/**
	 * HTTP method
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

	/**
	 * Request body
	 */
	body?: any;

	/**
	 * Query parameters
	 */
	query?: Record<string, string | number | boolean | string[] | undefined>;

	/**
	 * Custom headers
	 */
	headers?: Record<string, string>;

	/**
	 * Whether to throw on error
	 */
	throw?: boolean;

	/**
	 * Callback on successful response
	 */
	onSuccess?: (context: ResponseContext<T>) => void | Promise<void>;

	/**
	 * Callback on error response
	 */
	onError?: (context: ResponseContext<T>) => void | Promise<void>;

	/**
	 * Additional fetch options
	 */
	fetchOptions?: RequestInit;
}

export interface ResponseContext<T = any> {
	/**
	 * Response data
	 */
	data: T | null;

	/**
	 * Original response object
	 */
	response: Response;

	/**
	 * Error information
	 */
	error: {
		message: string;
		status: number;
		code?: string;
	} | null;

	/**
	 * Whether the request was successful
	 */
	ok: boolean;
}

export interface C15tClientPlugin {
	/**
	 * Unique plugin identifier
	 */
	id: string;

	/**
	 * Plugin initialization
	 */
	init?: (client: any) => void;

	/**
	 * Extensions to client methods
	 */
	methods?: Record<string, Function>;

	/**
	 * Type inference for plugin
	 */
	$InferServerPlugin?: any;
}

export interface ConsentRecord {
	id: string;
	preferences: Record<string, boolean>;
	createdAt: Date;
	updatedAt: Date;
	expiresAt: Date;
}

export interface ConsentPurpose {
	id: string;
	name: string;
	description: string;
	required: boolean;
	default?: boolean;
	legalBasis?: string;
}