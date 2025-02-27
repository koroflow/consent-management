// client/types.ts

/**
 * Configuration options for initializing a c15t client.
 *
 * This interface defines the required and optional parameters for creating
 * a client that can interact with the c15t consent management API.
 *
 * @example
 * ```typescript
 * const options: c15tClientOptions = {
 *   baseURL: 'https://api.example.com/consent',
 *   headers: {
 *     'X-API-Key': 'your-api-key',
 *     'Authorization': 'Bearer token'
 *   },
 *   plugins: [analyticsPlugin(), geoPlugin()]
 * };
 * ```
 */
export interface c15tClientOptions {
	/**
	 * Base URL for API endpoints.
	 *
	 * The URL should point to the root of the c15t API without a trailing slash.
	 * All endpoint paths will be appended to this base URL.
	 *
	 * @example 'https://api.example.com/consent'
	 */
	baseURL: string;

	/**
	 * Default request headers to include with all API requests.
	 *
	 * Common headers include API keys, authorization tokens, and content type.
	 * These headers will be included in every request made by the client.
	 *
	 * @example { 'X-API-Key': 'your-api-key', 'Authorization': 'Bearer token' }
	 */
	headers?: Record<string, string>;

	/**
	 * Additional configuration options for the fetch implementation.
	 *
	 * These options control the behavior of the underlying HTTP client.
	 */
	fetchOptions?: {
		/**
		 * Custom fetch implementation to use instead of the global fetch.
		 *
		 * This can be useful for environments without a native fetch,
		 * or for using a fetch implementation with additional features.
		 */
		customFetchImpl?: typeof fetch;
	};

	/**
	 * Client plugins to extend the core client functionality.
	 *
	 * Plugins can add additional methods and features to the client,
	 * such as analytics tracking, geo-location services, etc.
	 */
	plugins?: c15tClientPlugin[];
}

/**
 * Request configuration options for API requests.
 *
 * This interface defines the options that can be provided when making
 * HTTP requests to the c15t API endpoints.
 *
 * @template T The expected response data type
 */
export interface FetchOptions<T = unknown> {
	/**
	 * HTTP method for the request.
	 *
	 * Defaults to 'GET' if not specified.
	 */
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

	/**
	 * Request body to send with the request.
	 *
	 * For non-GET requests, this data will be serialized as JSON
	 * and sent in the request body.
	 */
	body?: Record<string, unknown>;

	/**
	 * Query parameters to include in the request URL.
	 *
	 * These parameters will be appended to the URL as query string parameters.
	 * Array values will result in multiple query parameters with the same name.
	 */
	query?: Record<string, string | number | boolean | string[] | undefined>;

	/**
	 * Custom headers to include with this specific request.
	 *
	 * These headers will be merged with the default headers
	 * configured for the client.
	 */
	headers?: Record<string, string>;

	/**
	 * Whether to throw an error when the response is not successful.
	 *
	 * If true, the client will throw an error for non-2xx responses
	 * instead of returning a response context with the error.
	 *
	 * @default false
	 */
	throw?: boolean;

	/**
	 * Callback function to execute on successful response.
	 *
	 * This function will be called when the request completes successfully
	 * with a 2xx status code.
	 *
	 * @param context The response context containing the result data
	 */
	onSuccess?: (context: ResponseContext<T>) => void | Promise<void>;

	/**
	 * Callback function to execute on error response.
	 *
	 * This function will be called when the request fails with a non-2xx
	 * status code or when an exception occurs during the request.
	 *
	 * @param context The response context containing the error details
	 */
	onError?: (context: ResponseContext<T>) => void | Promise<void>;

	/**
	 * Additional fetch options to include in the request.
	 *
	 * These options will be passed directly to the fetch implementation.
	 */
	fetchOptions?: RequestInit;
}

/**
 * Response context returned from API requests.
 *
 * This interface contains the complete information about an API response,
 * including the data, response object, and any error information.
 *
 * @template T The expected response data type
 */
export interface ResponseContext<T = unknown> {
	/**
	 * Response data returned by the API.
	 *
	 * For successful requests, this will contain the parsed JSON response.
	 * For failed requests or non-JSON responses, this will be null.
	 */
	data: T | null;

	/**
	 * Original fetch Response object.
	 *
	 * This contains the raw response information, such as status, headers, etc.
	 * For network errors or other exceptions, this may be null.
	 */
	response: Response;

	/**
	 * Error information if the request failed.
	 *
	 * This will be null for successful requests (2xx status codes).
	 * For failed requests, this contains the error details.
	 */
	error: {
		/**
		 * Error message describing what went wrong
		 */
		message: string;

		/**
		 * HTTP status code or custom error code
		 */
		status: number;

		/**
		 * Optional error code for more specific error identification
		 */
		code?: string;
	} | null;

	/**
	 * Whether the request was successful.
	 *
	 * True for successful requests (2xx status codes), false otherwise.
	 */
	ok: boolean;
}

/**
 * Client plugin interface for extending the c15t client functionality.
 *
 * Plugins can add additional methods and features to the client,
 * such as analytics tracking, geo-location services, etc.
 */
export interface c15tClientPlugin {
	/**
	 * Unique plugin identifier.
	 *
	 * This ID should be unique across all plugins to avoid conflicts.
	 */
	id: string;

	/**
	 * Plugin initialization function.
	 *
	 * This function is called when the plugin is registered with the client.
	 * It can be used to set up the plugin and perform any necessary initialization.
	 *
	 * @param client The c15t client instance this plugin is being initialized with
	 */
	init?: (client: c15tClient) => void;

	/**
	 * Extensions to client methods.
	 *
	 * These methods will be added to the client instance, allowing plugins
	 * to extend the client's functionality with additional methods.
	 */
	methods?: Record<string, (...args: unknown[]) => unknown>;

	/**
	 * Type inference for the server-side plugin implementation.
	 *
	 * This is used for type checking to ensure the client plugin is compatible
	 * with the server-side plugin implementation.
	 */
	$InferServerPlugin?: Record<string, unknown>;
}

/**
 * Interface representing a consent record.
 *
 * A consent record contains information about a user's consent preferences,
 * including which purposes they have consented to and when that consent was given.
 */
export interface ConsentRecord {
	/**
	 * Unique identifier for the consent record
	 */
	id: string;

	/**
	 * Map of purpose IDs to boolean consent values
	 */
	preferences: Record<string, boolean>;

	/**
	 * When the consent record was first created
	 */
	createdAt: Date;

	/**
	 * When the consent record was last updated
	 */
	updatedAt: Date;

	/**
	 * When the consent record will expire
	 */
	expiresAt: Date;
}

/**
 * Interface representing a consent purpose.
 *
 * A consent purpose defines a specific reason for collecting or processing data,
 * such as analytics, marketing, or personalization.
 */
export interface ConsentPurpose {
	/**
	 * Unique identifier for the purpose
	 */
	id: string;

	/**
	 * Human-readable name of the purpose
	 */
	name: string;

	/**
	 * Detailed description of what this purpose entails
	 */
	description: string;

	/**
	 * Whether consent for this purpose is required
	 */
	required: boolean;

	/**
	 * Whether consent for this purpose is enabled by default
	 */
	default?: boolean;

	/**
	 * Legal basis for processing data under this purpose
	 * (e.g., 'consent', 'legitimate interest', 'contract')
	 */
	legalBasis?: string;
}

/**
 * Interface for c15t client instance.
 * This is used for the plugin init type to avoid circular references.
 */
export interface c15tClient {
	$fetch<T>(
		path: string,
		options?: FetchOptions<T>
	): Promise<ResponseContext<T>>;
	[key: string]: unknown;
}
