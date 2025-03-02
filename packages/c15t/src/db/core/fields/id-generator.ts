/**
 * Custom ID generation system for C15T entities
 *
 * Provides prefixed, time-ordered, unique identifiers for all system entities.
 * Each entity type has a specific prefix to make IDs self-descriptive about
 * their origin and purpose.
 */
import baseX from 'base-x';

/**
 * Base-58 encoder for generating short, URL-friendly identifiers
 * Uses a character set that avoids visually ambiguous characters.
 */
const b58 = baseX('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');

/**
 * Generates a unique ID with the specified prefix
 *
 * Creates time-ordered, prefixed, base58-encoded identifiers that:
 * - Start with the provided prefix for clear identification
 * - Embed a timestamp for chronological ordering
 * - Include random data for uniqueness
 *
 * @param prefix - The prefix to use for the ID
 * @returns A unique, prefixed identifier
 *
 * @example
 * ```typescript
 * const userId = generateId("usr"); // "usr_3hK4G..."
 * const consentId = generateId("cns"); // "cns_5RtX9..."
 * ```
 */
export function generateId(prefix: string): string {
	const buf = crypto.getRandomValues(new Uint8Array(20));

	/**
	 * Epoch starts more recently to extend timestamp lifetime.
	 * From 2023-11-14T22:13:20.000Z (1700000000000) to ~2159.
	 */
	const EPOCH_TIMESTAMP = 1_700_000_000_000;

	const t = Date.now() - EPOCH_TIMESTAMP;

	buf[0] = (t >>> 24) & 255;
	buf[1] = (t >>> 16) & 255;
	buf[2] = (t >>> 8) & 255;
	buf[3] = t & 255;

	return `${prefix}_${b58.encode(buf)}`;
}

/**
 * Creates an ID generator function for a specific prefix
 *
 * @param prefix - The prefix to create an ID generator for
 * @returns A function that generates IDs for the specified prefix
 *
 * @example
 * ```typescript
 * const generateUserId = createIdGenerator('usr');
 * const newUserId = generateUserId(); // "usr_3hK4G..."
 * ```
 */
export function createIdGenerator(prefix: string): () => string {
	return () => generateId(prefix);
}

/**
 * Table context with entityPrefix
 */
export interface TableWithPrefix {
	entityPrefix: string;
}

/**
 * Default ID generator function for tables
 *
 * This function automatically uses the table's entityPrefix to generate IDs.
 * It should be used directly in table definitions.
 *
 * @example
 * ```typescript
 * // In table definition:
 * {
 *   entityName: 'user',
 *   entityPrefix: 'usr',  // This prefix will be used for IDs
 *   generateId: defaultIdGenerator,
 *   // ...
 * }
 * ```
 */
export function defaultIdGenerator(this: TableWithPrefix): string {
	return generateId(this.entityPrefix);
}
