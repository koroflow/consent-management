// client/index.ts

import type { C15tClientOptions, FetchOptions, ResponseContext } from '..';
import type {
	ConsentChangeEvent,
	ConsentPreference,
	ConsentPurpose,
} from '../types';

export class C15tClient {
	private baseURL: string;
	private headers: Record<string, string>;
	private customFetch?: typeof fetch;

	constructor(options: C15tClientOptions) {
		this.baseURL = options.baseURL.endsWith('/')
			? options.baseURL.slice(0, -1)
			: options.baseURL;

		this.headers = {
			'Content-Type': 'application/json',
			...options.headers,
		};

		this.customFetch = options.fetchOptions?.customFetchImpl;
	}

	private async fetcher<T>(
		path: string,
		options: FetchOptions<T> = {}
	): Promise<ResponseContext<T>> {
		try {
			const url = new URL(path, this.baseURL);

			// Add query parameters
			if (options.query) {
				for (const [key, value] of Object.entries(options.query)) {
					if (value !== undefined) {
						if (Array.isArray(value)) {
							for (const v of value) {
								url.searchParams.append(key, String(v));
							}
						} else {
							url.searchParams.append(key, String(value));
						}
					}
				}
			}

			const fetchOptions: RequestInit = {
				method: options.method || 'GET',
				headers: {
					...this.headers,
					...options.headers,
				},
			};

			// Add body for non-GET requests
			if (options.body && fetchOptions.method !== 'GET') {
				fetchOptions.body = JSON.stringify(options.body);
			}

			// Use custom fetch if provided, otherwise use global fetch
			const fetchImpl = this.customFetch || fetch;
			const response = await fetchImpl(url.toString(), fetchOptions);

			let data: T | null = null;
			let error: Error | null = null;

			// Parse response data
			if (response.status !== 204) {
				try {
					data = await response.json();
				} catch (err) {
					if (response.ok) {
						data = null;
					} else {
						error = new Error(
							`Failed to parse response: ${(err as Error).message}`
						);
					}
				}
			}

			// Create context object
			const context: ResponseContext<T> = {
				data,
				response,
				error: error
					? {
							message: error.message,
							status: response.status,
						}
					: null,
				ok: response.ok,
			};

			// Handle callbacks
			if (response.ok) {
				if (options.onSuccess) {
					await options.onSuccess(context);
				}
			} else {
				if (options.onError) {
					await options.onError(context);
				}

				// Throw error if requested
				if (options.throw) {
					throw {
						status: response.status,
						data,
					};
				}
			}

			return context;
		} catch (error: unknown) {
			if (options.onError) {
				const errorObj = error as Error;
				const context: ResponseContext<T> = {
					data: null,
					error: {
						message: errorObj.message || 'Request failed',
						status: (error as { status?: number }).status || 500,
						code: (error as { code?: string }).code,
					},
					ok: false,
					response: null as unknown as Response, // Type assertion to handle null as Response
				};

				await options.onError(context);

				if (options.throw) {
					throw error;
				}

				return context;
			}

			if (options.throw) {
				throw error;
			}

			return {
				data: null,
				error: {
					message: (error as Error).message || 'Request failed',
					status: (error as { status?: number }).status || 500,
					code: (error as { code?: string }).code,
				},
				ok: false,
				response: null as unknown as Response, // Type assertion to handle null as Response
			};
		}
	}

	/**
	 * Get current consent preferences
	 */
	async getConsent(
		options?: FetchOptions<ConsentPreference>
	): Promise<ResponseContext<ConsentPreference>> {
		return this.fetcher<ConsentPreference>('/get-consent', {
			method: 'GET',
			...options,
		});
	}

	/**
	 * List available consent purposes
	 */
	async listPurposes(
		options?: FetchOptions<ConsentPurpose[]>
	): Promise<ResponseContext<ConsentPurpose[]>> {
		return this.fetcher<ConsentPurpose[]>('/list-purposes', {
			method: 'GET',
			...options,
		});
	}

	/**
	 * Update consent preferences
	 */
	async updateConsent(
		preferences: Record<string, boolean>,
		options?: FetchOptions<ConsentPreference>
	): Promise<ResponseContext<ConsentPreference>> {
		return this.fetcher<ConsentPreference>('/update-consent', {
			method: 'POST',
			body: { preferences },
			...options,
		});
	}

	/**
	 * Get consent history
	 */
	async getConsentHistory(
		query?: {
			recordId?: string;
			userId?: string;
			deviceId?: string;
			limit?: number;
			offset?: number;
		},
		options?: FetchOptions<ConsentChangeEvent[]>
	): Promise<ResponseContext<ConsentChangeEvent[]>> {
		return this.fetcher<ConsentChangeEvent[]>('/consent-history', {
			method: 'GET',
			query,
			...options,
		});
	}

	/**
	 * Generic fetch method for custom endpoints
	 */
	async $fetch<T>(
		path: string,
		options?: FetchOptions<T>
	): Promise<ResponseContext<T>> {
		return this.fetcher<T>(path, options);
	}
}

/**
 * Create a client instance
 */
export function createConsentClient(options: C15tClientOptions): C15tClient {
	return new C15tClient(options);
}
