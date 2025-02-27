/**
 * Storage Adapter Utilities for c15t
 * 
 * This module provides utility functions for working with storage adapters in the c15t
 * consent management system. It includes functionality for initializing storage adapters,
 * creating composite adapters that can use multiple storage backends, and resolving
 * storage references to concrete implementations.
 * 
 * @example
 * ```typescript
 * // Initialize a storage adapter from configuration
 * const storage = await getStorageAdapter({
 *   storage: 'memory',
 *   // other options...
 * });
 * 
 * // Use the storage adapter
 * const consent = await storage.getConsent('consent-id');
 * ```
 */
import { memoryAdapter } from './memory';
import type { c15tOptions } from '../types/options';
import type { Storage } from '../types/storage';
import { c15tError } from '../error/codes';
import type { ConsentRecord } from '~/types';

/**
 * Initializes the storage system based on configuration options
 * 
 * This function creates and returns a Storage adapter based on the provided configuration.
 * If a secondary storage is configured, it creates a composite adapter that uses both
 * the primary and secondary storage implementations.
 * 
 * @param options - The c15t configuration options containing storage settings
 * @returns A Promise resolving to a fully initialized Storage adapter
 * @throws {c15tError} If the storage type is invalid or initialization fails
 */
export async function getStorageAdapter(
	options: c15tOptions
): Promise<Storage> {
	// Get primary storage adapter
	const storageAdapter = await resolveStorage(options.storage);

	// If there's a secondary storage configured, create a composite adapter
	if (options.secondaryStorage) {
		const secondaryAdapter = await resolveStorage(options.secondaryStorage);
		return createCompositeAdapter(storageAdapter, secondaryAdapter);
	}

	return storageAdapter;
}

/**
 * Resolves a storage reference to a concrete Storage implementation
 * 
 * This function resolves a storage reference, which can be:
 * - An object implementing the Storage interface
 * - The string 'memory' for the in-memory adapter
 * - Any other string (for future adapter types)
 * 
 * @param storage - The storage reference to resolve
 * @returns A Promise resolving to a concrete Storage implementation
 * @throws {c15tError} If the storage type is unknown or invalid
 */
async function resolveStorage(
	storage: Storage | 'memory' | string
): Promise<Storage> {
	if (typeof storage === 'object') {
		return storage;
	}

	if (storage === 'memory') {
		return memoryAdapter();
	}

	throw new c15tError(
		`Unknown storage type: ${storage}`
	);
}

/**
 * Creates a composite adapter that combines primary and secondary storage
 * 
 * This function creates a Storage adapter that uses both primary and secondary
 * storage implementations. The composite adapter works as follows:
 * 
 * - For write operations (create/update): Write to both primary and secondary
 * - For read operations: Try primary first, fall back to secondary if not found
 * - If data is found in secondary but not primary, it's synced back to primary
 * 
 * This approach provides resilience against primary storage failures and
 * automatically syncs data between storage layers.
 * 
 * @param primary - The primary storage adapter
 * @param secondary - The secondary (fallback) storage adapter
 * @returns A composite Storage adapter that uses both storage implementations
 */
function createCompositeAdapter(primary: Storage, secondary: Storage): Storage {
	// For methods that create/update data, we want to use both storages
	// For methods that retrieve data, we want to try primary first, then fall back to secondary

	return {
		...primary,

		/**
		 * Sets a value in both primary and secondary storage
		 * 
		 * @param key - The key to set
		 * @param value - The value to store
		 * @param ttl - Optional time-to-live in seconds
		 */
		async set(key: string, value: string, ttl?: number): Promise<void> {
			await primary.set(key, value, ttl);
			await secondary.set(key, value, ttl);
		},

		/**
		 * Gets a value, trying primary storage first, then secondary
		 * If the value is found in secondary but not primary, it's synced back to primary
		 * 
		 * @param key - The key to retrieve
		 * @returns The stored value, or null if not found in either storage
		 */
		async get(key: string): Promise<string | null> {
			let result = await primary.get(key);

			if (result === null) {
				result = await secondary.get(key);

				// If we found it in secondary storage, sync it back to primary
				if (result !== null) {
					await primary.set(key, result);
				}
			}

			return result;
		},

		/**
		 * Deletes a value from both primary and secondary storage
		 * 
		 * @param key - The key to delete
		 */
		async delete(key: string): Promise<void> {
			await primary.delete(key);
			await secondary.delete(key);
		},

		/**
		 * Sets a rate limit value in both primary and secondary storage
		 * 
		 * @param key - The rate limit key
		 * @param value - The rate limit value
		 * @param ttl - Time-to-live in seconds
		 */
		async setRateLimit(key: string, value: number, ttl: number): Promise<void> {
			await primary.setRateLimit(key, value, ttl);
			await secondary.setRateLimit(key, value, ttl);
		},

		/**
		 * Gets a rate limit value, trying primary storage first, then secondary
		 * 
		 * @param key - The rate limit key
		 * @returns The rate limit value, or null if not found in either storage
		 */
		async getRateLimit(key: string): Promise<number | null> {
			let result = await primary.getRateLimit(key);

			if (result === null) {
				result = await secondary.getRateLimit(key);
			}

			return result;
		},

		/**
		 * Increments a rate limit value in primary storage and syncs to secondary
		 * 
		 * @param key - The rate limit key
		 * @returns The new rate limit value after incrementing
		 */
		async incrementRateLimit(key: string): Promise<number> {
			// For increments, we need to make sure both storages are in sync
			const value = await primary.incrementRateLimit(key);
			await secondary.setRateLimit(key, value, 60); // Default TTL
			return value;
		},

		/**
		 * Gets a consent record, trying primary storage first, then secondary
		 * If the record is found in secondary but not primary, it's synced back to primary
		 * 
		 * @param id - The ID of the consent record to retrieve
		 * @returns The consent record, or null if not found in either storage
		 */
		async getConsent(id: string): Promise<ConsentRecord | null> {
			let result = await primary.getConsent(id);

			if (result === null) {
				result = await secondary.getConsent(id);

				if (result !== null) {
					await primary.createConsent(result);
				}
			}

			return result;
		},

		/**
		 * Creates a consent record in both primary and secondary storage
		 * 
		 * @param consent - The consent record to create
		 * @returns The created consent record
		 */
		async createConsent(consent: ConsentRecord): Promise<ConsentRecord> {
			const result = await primary.createConsent(consent);
			await secondary.createConsent(result);
			return result;
		},

		/**
		 * Updates a consent record in both primary and secondary storage
		 * 
		 * @param id - The ID of the consent record to update
		 * @param data - The updated consent data
		 * @returns The updated consent record
		 */
		async updateConsent(id: string, data: ConsentRecord): Promise<ConsentRecord> {
			const result = await primary.updateConsent(id, data);
			await secondary.updateConsent(id, data);
			return result;
		},
	};
}
