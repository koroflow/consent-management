/**
 * Storage System Types for c15t
 * 
 * This module defines the storage interface used by the c15t consent management system.
 * The Storage interface provides methods for managing consent purposes, consent records,
 * preferences, history, rate limiting, and general key-value storage.
 * 
 * Storage adapters implement this interface to provide different backend options
 * such as in-memory storage, databases, or cloud storage solutions.
 */
// types/storage.ts
import type {
	ConsentChangeEvent,
	ConsentPreference,
	ConsentPurpose,
	ConsentRecord,
} from './index';

/**
 * Options for retrieving consent history
 */
export interface ConsentHistoryOptions {
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
 * Storage interface for the c15t consent management system
 * 
 * This interface defines the methods required for a storage adapter.
 * Storage adapters are responsible for persisting consent data and
 * providing retrieval mechanisms.
 * 
 * Multiple storage implementations can be used, such as:
 * - In-memory storage for development and testing
 * - Database storage for production
 * - Distributed cache systems for high-performance applications
 */
export interface Storage {
	// Purpose management
	/**
	 * Creates a new consent purpose
	 * 
	 * @param purpose - The consent purpose to create
	 * @returns A Promise resolving to the created consent purpose with timestamps
	 */
	createPurpose(
		purpose: Omit<ConsentPurpose, 'createdAt' | 'updatedAt'> & {
			createdAt?: Date;
			updatedAt?: Date;
		}
	): Promise<ConsentPurpose>;

	/**
	 * Updates an existing consent purpose
	 * 
	 * @param id - The ID of the purpose to update
	 * @param data - The updated purpose data
	 * @returns A Promise resolving to the updated consent purpose
	 * @throws Error if the purpose is not found
	 */
	updatePurpose(
		id: string,
		data: Partial<Omit<ConsentPurpose, 'id' | 'createdAt'>> & {
			updatedAt?: Date;
		}
	): Promise<ConsentPurpose>;

	/**
	 * Deletes a consent purpose
	 * 
	 * @param id - The ID of the purpose to delete
	 * @returns A Promise resolving to true if deleted, false if not found
	 */
	deletePurpose(id: string): Promise<boolean>;

	/**
	 * Retrieves a consent purpose by ID
	 * 
	 * @param id - The ID of the purpose to retrieve
	 * @returns A Promise resolving to the consent purpose, or null if not found
	 */
	getPurpose(id: string): Promise<ConsentPurpose | null>;

	/**
	 * Lists all consent purposes
	 * 
	 * @returns A Promise resolving to an array of all consent purposes
	 */
	listPurposes(): Promise<ConsentPurpose[]>;

	// Consent management
	/**
	 * Creates a new consent record
	 * 
	 * @param consent - The consent record to create
	 * @returns A Promise resolving to the created consent record with timestamps
	 */
	createConsent(
		consent: Omit<ConsentRecord, 'createdAt' | 'updatedAt'> & {
			createdAt?: Date;
			updatedAt?: Date;
		}
	): Promise<ConsentRecord>;

	/**
	 * Updates an existing consent record
	 * 
	 * @param id - The ID of the consent record to update
	 * @param data - The updated consent data
	 * @returns A Promise resolving to the updated consent record
	 * @throws Error if the consent record is not found
	 */
	updateConsent(
		id: string,
		data: Partial<Omit<ConsentRecord, 'id' | 'createdAt'>> & {
			updatedAt?: Date;
		}
	): Promise<ConsentRecord>;

	/**
	 * Deletes a consent record
	 * 
	 * @param id - The ID of the consent record to delete
	 * @returns A Promise resolving to true if deleted, false if not found
	 */
	deleteConsent(id: string): Promise<boolean>;

	/**
	 * Retrieves a consent record by ID
	 * 
	 * @param id - The ID of the consent record to retrieve
	 * @returns A Promise resolving to the consent record, or null if not found
	 */
	getConsent(id: string): Promise<ConsentRecord | null>;

	/**
	 * Retrieves a consent record by user ID
	 * 
	 * @param userId - The user ID to search for
	 * @returns A Promise resolving to the consent record, or null if not found
	 */
	getConsentByUser(userId: string): Promise<ConsentRecord | null>;

	/**
	 * Retrieves a consent record by device ID
	 * 
	 * @param deviceId - The device ID to search for
	 * @returns A Promise resolving to the consent record, or null if not found
	 */
	getConsentByDevice(deviceId: string): Promise<ConsentRecord | null>;

	// Preference management
	/**
	 * Retrieves a consent preference
	 * 
	 * @param purposeId - The purpose ID of the preference
	 * @param userId - Optional user ID to filter by
	 * @param deviceId - Optional device ID to filter by
	 * @returns A Promise resolving to the consent preference, or null if not found
	 */
	getPreference(
		purposeId: string,
		userId?: string,
		deviceId?: string
	): Promise<ConsentPreference | null>;

	/**
	 * Sets a consent preference
	 * 
	 * @param purposeId - The purpose ID for the preference
	 * @param allowed - Whether consent is granted (true) or denied (false)
	 * @param userId - Optional user ID
	 * @param deviceId - Optional device ID
	 * @returns A Promise resolving to the created or updated consent preference
	 */
	setPreference(
		purposeId: string,
		allowed: boolean,
		userId?: string,
		deviceId?: string
	): Promise<ConsentPreference>;

	// Consent history
	/**
	 * Logs a consent change event
	 * 
	 * @param event - The consent change event to log
	 * @returns A Promise resolving to the logged event with auto-generated timestamp
	 */
	logConsentChange(
		event: Omit<ConsentChangeEvent, 'id'>
	): Promise<ConsentChangeEvent>;

	/**
	 * Retrieves consent change history with filtering and pagination
	 * 
	 * @param options - Options for filtering and pagination
	 * @returns A Promise resolving to an array of consent change events matching the criteria
	 */
	getConsentHistory(options: ConsentHistoryOptions): Promise<ConsentChangeEvent[]>;

	// Rate limiting
	/**
	 * Sets a rate limit value
	 * 
	 * @param key - The rate limit key
	 * @param value - The rate limit value
	 * @param ttl - Time-to-live in seconds
	 * @returns A Promise that resolves when the rate limit is set
	 */
	setRateLimit(key: string, value: number, ttl: number): Promise<void>;

	/**
	 * Gets a rate limit value
	 * 
	 * @param key - The rate limit key
	 * @returns A Promise resolving to the rate limit value, or null if not found or expired
	 */
	getRateLimit(key: string): Promise<number | null>;

	/**
	 * Increments a rate limit value
	 * 
	 * @param key - The rate limit key
	 * @returns A Promise resolving to the new rate limit value after incrementing
	 */
	incrementRateLimit(key: string): Promise<number>;

	// Generic key-value storage
	/**
	 * Sets a value in the key-value store
	 * 
	 * @param key - The key to set
	 * @param value - The string value to store
	 * @param ttl - Optional time-to-live in seconds
	 * @returns A Promise that resolves when the value is set
	 */
	set(key: string, value: string, ttl?: number): Promise<void>;

	/**
	 * Gets a value from the key-value store
	 * 
	 * @param key - The key to retrieve
	 * @returns A Promise resolving to the stored value, or null if not found or expired
	 */
	get(key: string): Promise<string | null>;

	/**
	 * Deletes a value from the key-value store
	 * 
	 * @param key - The key to delete
	 * @returns A Promise that resolves when the value is deleted
	 */
	delete(key: string): Promise<void>;
}
