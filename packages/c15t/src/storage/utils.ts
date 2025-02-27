// storage/utils.ts
import { memoryAdapter } from './memory';
import type { C15tOptions } from '../types/options';
import type { Storage } from '../types/storage';
import { C15tError } from '../error/codes';

export async function getStorageAdapter(
	options: C15tOptions
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

async function resolveStorage(
	storage: Storage | 'memory' | string
): Promise<Storage> {
	if (typeof storage === 'object') {
		return storage;
	}

	if (storage === 'memory') {
		return memoryAdapter();
	}

	throw new C15tError(
		`Unknown storage type: ${storage}`,
		500,
		'UNKNOWN_STORAGE_TYPE'
	);
}

// Creates a composite adapter that uses both primary and secondary storage
function createCompositeAdapter(primary: Storage, secondary: Storage): Storage {
	// For methods that create/update data, we want to use both storages
	// For methods that retrieve data, we want to try primary first, then fall back to secondary

	return {
		...primary,

		// Override key-value methods to use both storages
		async set(key: string, value: string, ttl?: number): Promise<void> {
			await primary.set(key, value, ttl);
			await secondary.set(key, value, ttl);
		},

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

		async delete(key: string): Promise<void> {
			await primary.delete(key);
			await secondary.delete(key);
		},

		// Rate limiting methods
		async setRateLimit(key: string, value: number, ttl: number): Promise<void> {
			await primary.setRateLimit(key, value, ttl);
			await secondary.setRateLimit(key, value, ttl);
		},

		async getRateLimit(key: string): Promise<number | null> {
			let result = await primary.getRateLimit(key);

			if (result === null) {
				result = await secondary.getRateLimit(key);
			}

			return result;
		},

		async incrementRateLimit(key: string): Promise<number> {
			// For increments, we need to make sure both storages are in sync
			const value = await primary.incrementRateLimit(key);
			await secondary.setRateLimit(key, value, 60); // Default TTL
			return value;
		},

		// For consent records, try to keep both storages in sync
		async getConsent(id: string): Promise<any> {
			let result = await primary.getConsent(id);

			if (result === null) {
				result = await secondary.getConsent(id);

				if (result !== null) {
					await primary.createConsent(result);
				}
			}

			return result;
		},

		async createConsent(consent: any): Promise<any> {
			const result = await primary.createConsent(consent);
			await secondary.createConsent(result);
			return result;
		},

		async updateConsent(id: string, data: any): Promise<any> {
			const result = await primary.updateConsent(id, data);
			await secondary.updateConsent(id, data);
			return result;
		},
	};
}