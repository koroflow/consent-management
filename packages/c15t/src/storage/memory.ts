import type { Storage } from '../types/storage';
import type {
	ConsentPurpose,
	ConsentRecord,
	ConsentPreference,
	ConsentChangeEvent,
} from '../types';

/**
 * In-memory database structure for the storage adapter
 * 
 * This interface defines the structure of the in-memory storage used by the
 * memory adapter implementation. All consent data is stored in memory
 * using JavaScript Maps and Arrays.
 */
interface MemoryDB {
	/**
	 * Map of purpose IDs to consent purpose definitions
	 */
	purposes: Map<string, ConsentPurpose>;
	
	/**
	 * Map of consent record IDs to consent records
	 */
	consents: Map<string, ConsentRecord>;
	
	/**
	 * Map of preference keys to consent preferences
	 * Keys are formatted as `${purposeId}:${userId}:${deviceId}`
	 */
	preferences: Map<string, ConsentPreference>;
	
	/**
	 * Chronological array of consent change events
	 */
	consentHistory: ConsentChangeEvent[];
	
	/**
	 * Key-value store for general purpose data and rate limiting
	 * Each value includes an optional expiration timestamp
	 */
	keyValue: Map<string, { value: string; expires: number | null }>;
}

/**
 * Options for retrieving consent history
 */
interface ConsentHistoryOptions {
	/**
	 * Filter by consent record ID
	 */
	recordId?: string;
	
	/**
	 * Filter by user ID
	 */
	userId?: string;
	
	/**
	 * Filter by device ID
	 */
	deviceId?: string;
	
	/**
	 * Maximum number of records to return
	 * @default 50
	 */
	limit?: number;
	
	/**
	 * Number of records to skip
	 * @default 0
	 */
	offset?: number;
}

/**
 * Creates an in-memory storage adapter for c15t
 * 
 * This adapter provides a complete implementation of the Storage interface
 * using in-memory data structures. It's suitable for development, testing,
 * and small-scale deployments where persistence isn't required.
 * 
 * Note that all data is lost when the application restarts.
 * 
 * @example
 * ```typescript
 * import { memoryAdapter } from '@c15t/storage/memory';
 * 
 * const c15t = createc15t({
 *   storage: memoryAdapter()
 * });
 * ```
 * 
 * @returns A storage adapter that implements the Storage interface
 */
export function memoryAdapter(): Storage {
	// Initialize the in-memory database structure
	const db: MemoryDB = {
		purposes: new Map<string, ConsentPurpose>(),
		consents: new Map<string, ConsentRecord>(),
		preferences: new Map<string, ConsentPreference>(),
		consentHistory: [],
		keyValue: new Map<string, { value: string; expires: number | null }>(),
	};

	/**
	 * Generates a unique key for a preference entry
	 * 
	 * @param purposeId - The ID of the consent purpose
	 * @param userId - Optional user ID
	 * @param deviceId - Optional device ID
	 * @returns A concatenated key string
	 */
	const getPreferenceKey = (
		purposeId: string,
		userId?: string,
		deviceId?: string
	): string => {
		return `${purposeId}:${userId || ''}:${deviceId || ''}`;
	};

	/**
	 * Removes expired entries from the key-value store
	 * This is called automatically before read operations on the key-value store
	 */
	const cleanExpiredKeys = (): void => {
		const now = Date.now();
		for (const [key, { expires }] of db.keyValue.entries()) {
			if (expires !== null && expires < now) {
				db.keyValue.delete(key);
			}
		}
	};

	return {
		/**
		 * Creates a new consent purpose
		 * 
		 * @param purpose - The consent purpose to create
		 * @returns The created consent purpose with timestamps
		 */
		async createPurpose(purpose: Omit<ConsentPurpose, 'createdAt' | 'updatedAt'> & Partial<Pick<ConsentPurpose, 'createdAt' | 'updatedAt'>>): Promise<ConsentPurpose> {
			const now = new Date();
			const newPurpose: ConsentPurpose = {
				...purpose,
				createdAt: purpose.createdAt || now,
				updatedAt: purpose.updatedAt || now,
			};
			db.purposes.set(purpose.id, newPurpose);
			return newPurpose;
		},

		/**
		 * Updates an existing consent purpose
		 * 
		 * @param id - The ID of the purpose to update
		 * @param data - The updated purpose data
		 * @returns The updated consent purpose
		 * @throws Error if the purpose is not found
		 */
		async updatePurpose(id: string, data: Partial<ConsentPurpose> & { updatedAt?: Date }): Promise<ConsentPurpose> {
			const purpose = db.purposes.get(id);
			if (!purpose) {
				throw new Error(`Purpose not found: ${id}`);
			}

			const updatedPurpose: ConsentPurpose = {
				...purpose,
				...data,
				id,
				updatedAt: data.updatedAt || new Date(),
			};

			db.purposes.set(id, updatedPurpose);
			return updatedPurpose;
		},

		/**
		 * Deletes a consent purpose
		 * 
		 * @param id - The ID of the purpose to delete
		 * @returns True if the purpose was deleted, false if it was not found
		 */
		async deletePurpose(id: string): Promise<boolean> {
			return db.purposes.delete(id);
		},

		/**
		 * Retrieves a consent purpose by ID
		 * 
		 * @param id - The ID of the purpose to retrieve
		 * @returns The consent purpose, or null if not found
		 */
		async getPurpose(id: string): Promise<ConsentPurpose | null> {
			return db.purposes.get(id) || null;
		},

		/**
		 * Lists all consent purposes
		 * 
		 * @returns Array of all consent purposes
		 */
		async listPurposes(): Promise<ConsentPurpose[]> {
			return Array.from(db.purposes.values());
		},

		// Consent management
		/**
		 * Creates a new consent record
		 * 
		 * @param consent - The consent record to create
		 * @returns The created consent record with timestamps
		 */
		async createConsent(consent: Omit<ConsentRecord, 'createdAt' | 'updatedAt'> & Partial<Pick<ConsentRecord, 'createdAt' | 'updatedAt'>>): Promise<ConsentRecord> {
			const now = new Date();
			const newConsent: ConsentRecord = {
				...consent,
				createdAt: consent.createdAt || now,
				updatedAt: consent.updatedAt || now,
			};
			db.consents.set(consent.id, newConsent);
			return newConsent;
		},

		/**
		 * Updates an existing consent record
		 * 
		 * @param id - The ID of the consent record to update
		 * @param data - The updated consent data
		 * @returns The updated consent record
		 * @throws Error if the consent record is not found
		 */
		async updateConsent(id: string, data: Partial<ConsentRecord> & { updatedAt?: Date }): Promise<ConsentRecord> {
			const consent = db.consents.get(id);
			if (!consent) {
				throw new Error(`Consent not found: ${id}`);
			}

			const updatedConsent: ConsentRecord = {
				...consent,
				...data,
				id,
				updatedAt: data.updatedAt || new Date(),
				preferences: data.preferences || consent.preferences,
			};

			db.consents.set(id, updatedConsent);
			return updatedConsent;
		},

		/**
		 * Deletes a consent record
		 * 
		 * @param id - The ID of the consent record to delete
		 * @returns True if the record was deleted, false if it was not found
		 */
		async deleteConsent(id: string): Promise<boolean> {
			return db.consents.delete(id);
		},

		/**
		 * Retrieves a consent record by ID
		 * 
		 * @param id - The ID of the consent record to retrieve
		 * @returns The consent record, or null if not found
		 */
		async getConsent(id: string): Promise<ConsentRecord | null> {
			return db.consents.get(id) || null;
		},

		/**
		 * Retrieves a consent record by user ID
		 * 
		 * @param userId - The user ID to search for
		 * @returns The consent record for the user, or null if not found
		 */
		async getConsentByUser(userId: string): Promise<ConsentRecord | null> {
			for (const consent of db.consents.values()) {
				if (consent.userId === userId) {
					return consent;
				}
			}
			return null;
		},

		/**
		 * Retrieves a consent record by device ID
		 * 
		 * @param deviceId - The device ID to search for
		 * @returns The consent record for the device, or null if not found
		 */
		async getConsentByDevice(deviceId: string): Promise<ConsentRecord | null> {
			for (const consent of db.consents.values()) {
				if (consent.deviceId === deviceId) {
					return consent;
				}
			}
			return null;
		},

		// Preference management
		/**
		 * Retrieves a consent preference
		 * 
		 * @param purposeId - The purpose ID of the preference
		 * @param userId - Optional user ID
		 * @param deviceId - Optional device ID
		 * @returns The consent preference, or null if not found
		 */
		async getPreference(
			purposeId: string,
			userId?: string,
			deviceId?: string
		): Promise<ConsentPreference | null> {
			const key = getPreferenceKey(purposeId, userId, deviceId);
			return db.preferences.get(key) || null;
		},

		/**
		 * Sets a consent preference
		 * 
		 * @param purposeId - The purpose ID for the preference
		 * @param allowed - Whether consent is granted
		 * @param userId - Optional user ID
		 * @param deviceId - Optional device ID
		 * @returns The created or updated consent preference
		 */
		async setPreference(
			purposeId: string,
			allowed: boolean,
			userId?: string,
			deviceId?: string
		): Promise<ConsentPreference> {
			const key = getPreferenceKey(purposeId, userId, deviceId);
			const now = new Date();
			const expiresAt = new Date();
			expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Default to 1 year

			const preference: ConsentPreference = {
				id: key,
				purposeId,
				userId,
				deviceId,
				allowed,
				expiresAt,
				createdAt: now,
				updatedAt: now,
			};

			db.preferences.set(key, preference);
			return preference;
		},

		// Consent history
		/**
		 * Logs a consent change event
		 * 
		 * @param event - The consent change event to log
		 * @returns The logged event with auto-generated fields
		 */
		async logConsentChange(event: Omit<ConsentChangeEvent, 'timestamp'> & { timestamp?: Date }): Promise<ConsentChangeEvent> {
			const eventWithId: ConsentChangeEvent = {
				...event,
				timestamp: event.timestamp || new Date(),
				recordId: event.recordId,
				purposeId: event.purposeId,
				newState: event.newState,
				source: event.source || 'user',
			};

			db.consentHistory.push(eventWithId);
			return eventWithId;
		},

		/**
		 * Retrieves consent change history with filtering and pagination
		 * 
		 * @param options - Options for filtering and pagination
		 * @returns Array of consent change events matching the criteria
		 */
		async getConsentHistory(options: ConsentHistoryOptions): Promise<ConsentChangeEvent[]> {
			const { recordId, userId, deviceId, limit = 50, offset = 0 } = options;
			let result = db.consentHistory;

			if (recordId) {
				result = result.filter((event) => event.recordId === recordId);
			}

			if (userId) {
				result = result.filter((event) => event.userId === userId);
			}

			if (deviceId) {
				result = result.filter((event) => event.deviceId === deviceId);
			}

			// Sort by timestamp descending
			result = result.sort(
				(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
			);

			// Apply pagination
			return result.slice(offset, offset + limit);
		},

		// Rate limiting
		/**
		 * Sets a rate limit value
		 * 
		 * @param key - The rate limit key
		 * @param value - The rate limit value
		 * @param ttl - Time-to-live in seconds
		 */
		async setRateLimit(key: string, value: number, ttl: number): Promise<void> {
			const expires = ttl > 0 ? Date.now() + ttl * 1000 : null;
			db.keyValue.set(`rate:${key}`, {
				value: value.toString(),
				expires,
			});
		},

		/**
		 * Gets a rate limit value
		 * 
		 * @param key - The rate limit key
		 * @returns The rate limit value, or null if not found or expired
		 */
		async getRateLimit(key: string): Promise<number | null> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(`rate:${key}`);
			return entry ? Number.parseInt(entry.value, 10) : null;
		},

		/**
		 * Increments a rate limit value
		 * 
		 * @param key - The rate limit key
		 * @returns The new rate limit value after incrementing
		 */
		async incrementRateLimit(key: string): Promise<number> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(`rate:${key}`);
			const currentValue = entry ? Number.parseInt(entry.value, 10) : 0;
			const newValue = currentValue + 1;

			db.keyValue.set(`rate:${key}`, {
				value: newValue.toString(),
				expires: entry?.expires || null,
			});

			return newValue;
		},

		// Generic key-value storage
		/**
		 * Sets a value in the key-value store
		 * 
		 * @param key - The key to set
		 * @param value - The string value to store
		 * @param ttl - Optional time-to-live in seconds
		 */
		async set(key: string, value: string, ttl?: number): Promise<void> {
			const expires = ttl ? Date.now() + ttl * 1000 : null;
			db.keyValue.set(key, { value, expires });
		},

		/**
		 * Gets a value from the key-value store
		 * 
		 * @param key - The key to retrieve
		 * @returns The stored value, or null if not found or expired
		 */
		async get(key: string): Promise<string | null> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(key);
			return entry ? entry.value : null;
		},

		/**
		 * Deletes a value from the key-value store
		 * 
		 * @param key - The key to delete
		 */
		async delete(key: string): Promise<void> {
			db.keyValue.delete(key);
		},
	};
}
