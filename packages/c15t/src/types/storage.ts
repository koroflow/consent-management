// types/storage.ts
import type {
	ConsentChangeEvent,
	ConsentPreference,
	ConsentPurpose,
	ConsentRecord,
} from './index';

export interface Storage {
	// Purpose management
	createPurpose(
		purpose: Omit<ConsentPurpose, 'createdAt' | 'updatedAt'> & {
			createdAt?: Date;
			updatedAt?: Date;
		}
	): Promise<ConsentPurpose>;

	updatePurpose(
		id: string,
		data: Partial<Omit<ConsentPurpose, 'id' | 'createdAt'>> & {
			updatedAt?: Date;
		}
	): Promise<ConsentPurpose>;

	deletePurpose(id: string): Promise<boolean>;

	getPurpose(id: string): Promise<ConsentPurpose | null>;

	listPurposes(): Promise<ConsentPurpose[]>;

	// Consent management
	createConsent(
		consent: Omit<ConsentRecord, 'createdAt' | 'updatedAt'> & {
			createdAt?: Date;
			updatedAt?: Date;
		}
	): Promise<ConsentRecord>;

	updateConsent(
		id: string,
		data: Partial<Omit<ConsentRecord, 'id' | 'createdAt'>> & {
			updatedAt?: Date;
		}
	): Promise<ConsentRecord>;

	deleteConsent(id: string): Promise<boolean>;

	getConsent(id: string): Promise<ConsentRecord | null>;

	getConsentByUser(userId: string): Promise<ConsentRecord | null>;

	getConsentByDevice(deviceId: string): Promise<ConsentRecord | null>;

	// Preference management
	getPreference(
		purposeId: string,
		userId?: string,
		deviceId?: string
	): Promise<ConsentPreference | null>;

	setPreference(
		purposeId: string,
		allowed: boolean,
		userId?: string,
		deviceId?: string
	): Promise<ConsentPreference>;

	// Consent history
	logConsentChange(
		event: Omit<ConsentChangeEvent, 'id'>
	): Promise<ConsentChangeEvent>;

	getConsentHistory(options: {
		recordId?: string;
		userId?: string;
		deviceId?: string;
		limit?: number;
		offset?: number;
	}): Promise<ConsentChangeEvent[]>;

	// Rate limiting
	setRateLimit(key: string, value: number, ttl: number): Promise<void>;

	getRateLimit(key: string): Promise<number | null>;

	incrementRateLimit(key: string): Promise<number>;

	// Generic key-value storage
	set(key: string, value: string, ttl?: number): Promise<void>;

	get(key: string): Promise<string | null>;

	delete(key: string): Promise<void>;
}
