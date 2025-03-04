/**
 * Database Schema Type Definitions
 *
 * This module contains base type definitions for database schema configuration.
 * These types define the common structure of entity configurations used throughout
 * the c15t consent management system.
 */
import type { Field } from '~/db/core/fields';

// Import entity-specific types from their respective directories
import type { UserEntityConfig } from './user/types';
import type { PurposeEntityConfig } from './purpose/types';
import type { ConsentPolicyEntityConfig } from './consent-policy/types';
import type { DomainEntityConfig } from './domain/types';
import type { GeoLocationEntityConfig } from './geo-location/types';
import type { ConsentEntityConfig } from './consent/types';
import type { PurposeJunctionEntityConfig } from './purpose-junction/types';
import type { RecordEntityConfig } from './record/types';
import type { ConsentGeoLocationEntityConfig } from './consent-geo-location/types';
import type { WithdrawalEntityConfig } from './withdrawal/types';
import type { AuditLogEntityConfig } from './audit-log/types';

/**
 * Base entity configuration shared by all entities
 * Provides common configuration options for database entities
 */
export interface BaseEntityConfig {
	/**
	 * Custom model name for the entity table
	 */
	entityName?: string;

	/**
	 * The ID prefix for the entity table
	 * Used to generate unique prefixed IDs
	 */
	entityPrefix?: string;

	/**
	 * Custom field names for the entity table
	 */
	fields?: Record<string, string>;

	/**
	 * Additional fields for the entity table
	 */
	additionalFields?: Record<string, Field>;
}

/**
 * Entity configuration with standard timestamps
 * Extends base configuration with created/updated timestamp fields
 */
export interface TimestampedEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		createdAt?: string;
		updatedAt?: string;
	};
}

/**
 * Entity configuration for entities with active status
 * Extends timestamped configuration with isActive field
 */
export interface ActiveEntityConfig extends TimestampedEntityConfig {
	fields?: Record<string, string> & {
		createdAt?: string;
		updatedAt?: string;
		isActive?: string;
	};
}

/**
 * Database tables configuration
 * Contains all entity table configurations in one unified object
 */
export interface TablesConfig {
	/**
	 * User entity configuration
	 * @default entityName: "user", entityPrefix: "usr"
	 */
	user?: UserEntityConfig;

	/**
	 * Purpose entity configuration
	 * @default entityName: "purpose", entityPrefix: "pur"
	 */
	purpose?: PurposeEntityConfig;

	/**
	 * Consent policy configuration
	 * @default entityName: "consentPolicy", entityPrefix: "pol"
	 */
	consentPolicy?: ConsentPolicyEntityConfig;

	/**
	 * Domain configuration
	 * @default entityName: "domain", entityPrefix: "dom"
	 */
	domain?: DomainEntityConfig;

	/**
	 * Geo location configuration
	 * @default entityName: "geoLocation", entityPrefix: "geo"
	 */
	geoLocation?: GeoLocationEntityConfig;

	/**
	 * Consent configuration
	 * @default entityName: "consent", entityPrefix: "cns"
	 */
	consent?: ConsentEntityConfig;

	/**
	 * Purpose junction configuration
	 * @default entityName: "purposeJunction", entityPrefix: "pjx"
	 */
	purposeJunction?: PurposeJunctionEntityConfig;

	/**
	 * Record entity configuration
	 * @default entityName: "record", entityPrefix: "rec"
	 */
	record?: RecordEntityConfig;

	/**
	 * Consent geo location configuration
	 * @default entityName: "consentGeoLocation", entityPrefix: "cgl"
	 */
	consentGeoLocation?: ConsentGeoLocationEntityConfig;

	/**
	 * Withdrawal configuration
	 * @default entityName: "withdrawal", entityPrefix: "wdr"
	 */
	withdrawal?: WithdrawalEntityConfig;

	/**
	 * Audit log configuration
	 * @default entityName: "auditLog", entityPrefix: "log"
	 */
	auditLog?: AuditLogEntityConfig;
}

export type { UserEntityConfig } from './user/types';
export type { PurposeEntityConfig } from './purpose/types';
export type { ConsentPolicyEntityConfig } from './consent-policy/types';
export type { DomainEntityConfig } from './domain/types';
export type { GeoLocationEntityConfig } from './geo-location/types';
export type { ConsentEntityConfig } from './consent/types';
export type { PurposeJunctionEntityConfig } from './purpose-junction/types';
export type { RecordEntityConfig } from './record/types';
export type { ConsentGeoLocationEntityConfig } from './consent-geo-location/types';
export type { WithdrawalEntityConfig } from './withdrawal/types';
export type { AuditLogEntityConfig } from './audit-log/types';
