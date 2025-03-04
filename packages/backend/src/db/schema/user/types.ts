/**
 * User Entity Type Definitions
 *
 * This module contains type definitions specific to the user entity.
 */
import type { TimestampedEntityConfig } from '../types';

/**
 * User entity configuration
 * @default entityName: "user", entityPrefix: "usr"
 */
export interface UserEntityConfig extends TimestampedEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		isIdentified?: string;
		externalId?: string;
		identityProvider?: string;
		lastIpAddress?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}
