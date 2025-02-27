// storage/memory.ts
import { Storage } from '../types/storage';
import type {
	ConsentPurpose,
	ConsentRecord,
	ConsentPreference,
	ConsentChangeEvent,
} from '../types';

interface MemoryDB {
	purposes: Map<string, ConsentPurpose>;
	consents: Map<string, ConsentRecord>;
	preferences: Map<string, ConsentPreference>;
	consentHistory: ConsentChangeEvent[];
	keyValue: Map<string, { value: string; expires: number | null }>;
}

export function memoryAdapter(): Storage {
	const db: MemoryDB = {
		purposes: new Map<string, ConsentPurpose>(),
		consents: new Map<string, ConsentRecord>(),
		preferences: new Map<string, ConsentPreference>(),
		consentHistory: [],
		keyValue: new Map<string, { value: string; expires: number | null }>(),
	};

	// Helper to create a preference key
	const getPreferenceKey = (
		purposeId: string,
		userId?: string,
		deviceId?: string
	): string => {
		return `${purposeId}:${userId || ''}:${deviceId || ''}`;
	};

	// Helper to clean expired keys
	const cleanExpiredKeys = () => {
		const now = Date.now();
		for (const [key, { expires }] of db.keyValue.entries()) {
			if (expires !== null && expires < now) {
				db.keyValue.delete(key);
			}
		}
	};

	return {
		// Purpose management
		async createPurpose(purpose): Promise<ConsentPurpose> {
			const now = new Date();
			const newPurpose: ConsentPurpose = {
				...purpose,
				createdAt: purpose.createdAt || now,
				updatedAt: purpose.updatedAt || now,
			};
			db.purposes.set(purpose.id, newPurpose);
			return newPurpose;
		},

		async updatePurpose(id, data): Promise<ConsentPurpose> {
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

		async deletePurpose(id): Promise<boolean> {
			return db.purposes.delete(id);
		},

		async getPurpose(id): Promise<ConsentPurpose | null> {
			return db.purposes.get(id) || null;
		},

		async listPurposes(): Promise<ConsentPurpose[]> {
			return Array.from(db.purposes.values());
		},

		// Consent management
		async createConsent(consent): Promise<ConsentRecord> {
			const now = new Date();
			const newConsent: ConsentRecord = {
				...consent,
				createdAt: consent.createdAt || now,
				updatedAt: consent.updatedAt || now,
			};
			db.consents.set(consent.id, newConsent);
			return newConsent;
		},

		async updateConsent(id, data): Promise<ConsentRecord> {
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

		async deleteConsent(id): Promise<boolean> {
			return db.consents.delete(id);
		},

		async getConsent(id): Promise<ConsentRecord | null> {
			return db.consents.get(id) || null;
		},

		async getConsentByUser(userId): Promise<ConsentRecord | null> {
			for (const consent of db.consents.values()) {
				if (consent.userId === userId) {
					return consent;
				}
			}
			return null;
		},

		async getConsentByDevice(deviceId): Promise<ConsentRecord | null> {
			for (const consent of db.consents.values()) {
				if (consent.deviceId === deviceId) {
					return consent;
				}
			}
			return null;
		},

		// Preference management
		async getPreference(
			purposeId,
			userId,
			deviceId
		): Promise<ConsentPreference | null> {
			const key = getPreferenceKey(purposeId, userId, deviceId);
			return db.preferences.get(key) || null;
		},

		async setPreference(
			purposeId,
			allowed,
			userId,
			deviceId
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
	async logConsentChange(event): Promise<ConsentChangeEvent> {
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

		async getConsentHistory(options): Promise<ConsentChangeEvent[]> {
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
		async setRateLimit(key: string, value: number, ttl: number): Promise<void> {
			const expires = ttl > 0 ? Date.now() + ttl * 1000 : null;
			db.keyValue.set(`rate:${key}`, {
				value: value.toString(),
				expires,
			});
		},

		async getRateLimit(key: string): Promise<number | null> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(`rate:${key}`);
			return entry ? parseInt(entry.value, 10) : null;
		},

		async incrementRateLimit(key: string): Promise<number> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(`rate:${key}`);
			const currentValue = entry ? parseInt(entry.value, 10) : 0;
			const newValue = currentValue + 1;

			db.keyValue.set(`rate:${key}`, {
				value: newValue.toString(),
				expires: entry?.expires || null,
			});

			return newValue;
		},

		// Generic key-value storage
		async set(key: string, value: string, ttl?: number): Promise<void> {
			const expires = ttl ? Date.now() + ttl * 1000 : null;
			db.keyValue.set(key, { value, expires });
		},

		async get(key: string): Promise<string | null> {
			cleanExpiredKeys();
			const entry = db.keyValue.get(key);
			return entry ? entry.value : null;
		},

		async delete(key: string): Promise<void> {
			db.keyValue.delete(key);
		},
	};
}