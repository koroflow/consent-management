import {
	pgTable,
	serial,
	uuid,
	varchar,
	text,
	json,
	timestamp,
	boolean,
	index,
	pgEnum,
	inet,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define PostgreSQL enum for record types
export const recordTypeEnum = pgEnum('consent_record_type', [
	'form_submission',
	'api_call',
	'banner_interaction',
	'preference_center',
	'verbal_consent',
	'offline_consent',
	'partner_consent',
	'implied_consent',
	'consent_migration',
	'withdrawal',
	'other',
]);

/**
 * users - Stores information about individuals interacting with the system
 *
 * @property id - UUID that serves as the primary key and public identifier for the user
 * @property isIdentified - Flag indicating if this is an anonymous user (false) or an identified user (true)
 * @property externalId - Optional identifier from a third-party identity provider (e.g., ClerkID)
 * @property identityProvider - Name of the external identity provider (e.g., 'clerk', 'auth0')
 * @property createdAt - Timestamp with timezone when the user record was created
 * @property updatedAt - Timestamp with timezone when the user record was last updated
 */
export const users = pgTable(
	'users',
	{
		id: uuid('id').primaryKey().notNull().defaultRandom(),
		// Flag to indicate if this is an identified/tracked user
		isIdentified: boolean('is_identified').default(false).notNull(),
		// Optional third-party identity provider ID (like ClerkID)
		externalId: varchar('external_id', { length: 255 }),
		// External identity provider name
		identityProvider: varchar('identity_provider', { length: 50 }),
		// Last known IP address for anonymous users
		lastIpAddress: inet('last_ip_address'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			externalIdIdx: index('external_id_idx').on(
				table.externalId,
				table.identityProvider
			),
		};
	}
);

/**
 * purposes - Defines the different purposes for which consent can be given
 *
 * @property id - Internal auto-incrementing primary key
 * @property code - Unique code identifying the purpose (e.g., 'analytics', 'marketing')
 * @property name - Human-readable name of the purpose
 * @property description - Detailed explanation of what this purpose entails
 * @property isEssential - Flag indicating if this purpose is essential for service operation
 * @property dataCategory - Category of personal data used for this purpose (e.g., 'profile', 'behavior')
 * @property legalBasis - Legal basis for data processing (e.g., 'consent', 'legitimate_interest')
 * @property isActive - Flag indicating if this purpose definition is currently active
 * @property createdAt - Timestamp with timezone when the purpose was created
 * @property updatedAt - Timestamp with timezone when the purpose was last updated
 */
export const purposes = pgTable('consent_purposes', {
	id: serial('id').primaryKey(),
	code: varchar('code', { length: 50 }).notNull().unique(),
	name: varchar('name', { length: 100 }).notNull(),
	description: text('description').notNull(),
	isEssential: boolean('is_essential').default(false).notNull(),
	dataCategory: varchar('data_category', { length: 50 }), // Personal data category
	legalBasis: varchar('legal_basis', { length: 50 }), // consent, contract, legitimate interest, etc.
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/**
 * consentPolicies - Stores version history of consent policies
 *
 * @property id - Internal auto-incrementing primary key
 * @property version - Version identifier of the policy (e.g., '1.0', '2023-01')
 * @property name - Human-readable name of the policy
 * @property effectiveDate - Date with timezone when this policy version became effective
 * @property expirationDate - Optional date with timezone when this policy version expires
 * @property content - Full text content of the policy
 * @property contentHash - Hash of the content for integrity verification
 * @property isActive - Flag indicating if this is the currently active policy
 * @property createdAt - Timestamp with timezone when the policy was created
 */
export const consentPolicies = pgTable('consent_policies', {
	id: serial('id').primaryKey(),
	version: varchar('version', { length: 20 }).notNull(),
	name: varchar('name', { length: 100 }).notNull(),
	effectiveDate: timestamp('effective_date', { withTimezone: true }).notNull(),
	expirationDate: timestamp('expiration_date', { withTimezone: true }),
	content: text('content').notNull(), // Store actual policy text
	contentHash: varchar('content_hash', { length: 64 }).notNull(), // Hash for integrity verification
	isActive: boolean('is_active').default(true).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/**
 * domains - Manages domains to which consent applies
 *
 * @property id - Internal auto-incrementing primary key
 * @property domain - Domain name or pattern (e.g., 'example.com', '*.example.com')
 * @property isPattern - Flag indicating if the domain is a pattern with wildcards
 * @property patternType - Type of pattern ('wildcard', 'regex') if isPattern is true
 * @property parentDomainId - Reference to parent domain for hierarchical relationships
 * @property description - Optional description of this domain
 * @property isActive - Flag indicating if this domain is currently active
 * @property createdAt - Timestamp with timezone when the domain was created
 * @property updatedAt - Timestamp with timezone when the domain was last updated
 */
export const domains = pgTable(
	'domains',
	{
		id: serial('id').primaryKey(),
		domain: varchar('domain', { length: 255 }).notNull().unique(),
		// Is this a pattern like *.example.com
		isPattern: boolean('is_pattern').default(false).notNull(),
		// Pattern type: wildcard, regex, etc.
		patternType: varchar('pattern_type', { length: 20 }),
		// Parent domain reference for domain hierarchies
		// parentDomainId: serial('parent_domain_id').references(() => domains.id),
		description: varchar('description', { length: 255 }),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			domainIdx: index('domain_unique_idx').on(table.domain),
		};
	}
);

/**
 * geoLocations - Stores geographic location information for regulatory compliance
 *
 * @property id - Internal auto-incrementing primary key
 * @property countryCode - ISO 2-letter country code (e.g., 'US', 'DE')
 * @property countryName - Full name of the country (e.g., 'United States', 'Germany')
 * @property regionCode - Code for state/province/region within the country
 * @property regionName - Name of state/province/region
 * @property regulatoryZones - Native PostgreSQL text array of applicable regulatory frameworks
 * @property createdAt - Timestamp with timezone when the location record was created
 */
export const geoLocations = pgTable(
	'geo_locations',
	{
		id: serial('id').primaryKey(),
		// Country info - sufficient for most regulatory needs
		countryCode: varchar('country_code', { length: 2 }).notNull(),
		countryName: varchar('country_name', { length: 100 }).notNull(),
		// Region/state info - useful for US states with specific laws (CCPA, etc.)
		regionCode: varchar('region_code', { length: 5 }),
		regionName: varchar('region_name', { length: 100 }),
		// Regulatory zones as native PostgreSQL array
		regulatoryZones: text('regulatory_zones').array(), // ["GDPR", "CCPA", "LGPD", etc.]
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			countryCodeIdx: index('country_code_idx').on(table.countryCode),
			locationIdx: index('location_idx').on(
				table.countryCode,
				table.regionCode
			),
		};
	}
);

/**
 * consents - Core table storing user consent records
 *
 * @property id - Internal auto-incrementing primary key
 * @property userId - Reference to the user giving consent
 * @property domainId - Reference to the domain for which consent is given
 * @property preferences - JSON object mapping consent purposes to boolean values
 * @property metadata - JSON object with context about how consent was obtained
 * @property policyId - Reference to the consent policy
 * @property ipAddress - IP address of the user at the time consent was given (INET type)
 * @property region - Geographic region code where consent was given
 * @property givenAt - Timestamp with timezone when consent was provided
 * @property validUntil - Optional expiration date for this consent (with timezone)
 * @property isActive - Flag indicating if this is the currently active consent record
 */
export const consents = pgTable(
	'consents',
	{
		id: serial('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		// Domain this consent applies to
		domainId: serial('domain_id')
			.notNull()
			.references(() => domains.id),
		// Store consent categories and their status
		preferences: json('preferences').notNull().$type<Record<string, boolean>>(),
		// Store consent metadata
		metadata: json('metadata').notNull(),
		// Policy ID this consent relates to
		policyId: serial('policy_id')
			.notNull()
			.references(() => consentPolicies.id),
		// IP address using PostgreSQL's native INET type
		ipAddress: inet('ip_address'),
		// Geographic region for regional compliance (like GDPR, CCPA)
		region: varchar('region', { length: 50 }),
		// Consent timestamp with timezone
		givenAt: timestamp('given_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		// Valid until date (for temporary consents) with timezone
		validUntil: timestamp('valid_until', { withTimezone: true }),
		// Is this the active consent record for this user?
		isActive: boolean('is_active').default(true).notNull(),
	},
	(table) => {
		return {
			userIdIdx: index('user_id_idx').on(table.userId),
			domainIdIdx: index('domain_id_idx').on(table.domainId),
			activeConsentIdx: index('active_consent_idx').on(
				table.userId,
				table.domainId,
				table.isActive
			),
			userDomainIdx: index('user_domain_idx').on(table.userId, table.domainId),
		};
	}
);

/**
 * purposeJunction - Maps specific purposes to consent records
 *
 * @property id - Internal auto-incrementing primary key
 * @property consentId - Reference to the consent record
 * @property purposeId - Reference to the purpose
 * @property isAccepted - Flag indicating if this specific purpose was accepted
 */
export const purposeJunction = pgTable(
	'consent_purpose_junction',
	{
		id: serial('id').primaryKey(),
		consentId: serial('consent_id')
			.notNull()
			.references(() => consents.id, { onDelete: 'cascade' }),
		purposeId: serial('purpose_id')
			.notNull()
			.references(() => purposes.id),
		isAccepted: boolean('is_accepted').notNull(),
	},
	(table) => {
		return {
			purposeIdx: index('consent_purpose_idx').on(
				table.consentId,
				table.purposeId
			),
		};
	}
);

/**
 * records - Stores evidence and audit trail of consent actions
 *
 * @property id - Internal auto-incrementing primary key
 * @property consentId - Reference to the consent this record relates to
 * @property recordType - Type of record using PostgreSQL enum type
 * @property recordTypeDetail - Additional context for custom record types
 * @property content - JSON object with the details of what happened
 * @property ipAddress - IP address associated with this specific record (INET type)
 * @property recordMetadata - Additional context about the record (UI version, device info)
 * @property createdAt - Timestamp with timezone when the record was created
 */
export const records = pgTable(
	'consent_records',
	{
		id: serial('id').primaryKey(),
		consentId: serial('consent_id')
			.notNull()
			.references(() => consents.id, { onDelete: 'cascade' }),
		// Record type using PostgreSQL enum
		recordType: recordTypeEnum('record_type').notNull(),
		// Optional detail for custom types
		recordTypeDetail: varchar('record_type_detail', { length: 100 }),
		// Content of the record (serialized form data, etc.)
		content: json('content').notNull(),
		// IP address specifically for this record using INET type
		ipAddress: inet('ip_address'),
		// Additional metadata specific to the record
		recordMetadata: json('record_metadata'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			consentIdIdx: index('record_consent_id_idx').on(table.consentId),
			recordTypeIdx: index('record_type_idx').on(table.recordType),
		};
	}
);

/**
 * consentGeoLocations - Links consent records to geographic locations
 *
 * @property id - Internal auto-incrementing primary key
 * @property consentId - Reference to the consent record
 * @property geoLocationId - Reference to the geographic location
 * @property createdAt - Timestamp with timezone when the association was created
 */
export const consentGeoLocations = pgTable('consent_geo_locations', {
	id: serial('id').primaryKey(),
	consentId: serial('consent_id').references(() => consents.id, {
		onDelete: 'cascade',
	}),
	geoLocationId: serial('geo_location_id').references(() => geoLocations.id),
	createdAt: timestamp('created_at', { withTimezone: true })
		.defaultNow()
		.notNull(),
});

/**
 * withdrawals - Dedicated table for tracking consent withdrawals/revocations
 *
 * @property id - Internal auto-incrementing primary key
 * @property consentId - Reference to the consent being withdrawn
 * @property revokedAt - Timestamp with timezone when consent was revoked
 * @property revocationReason - Optional text explanation for the withdrawal
 * @property method - Method used for withdrawal (e.g., 'web_form', 'api_call', 'customer_service')
 * @property actor - Entity that performed the withdrawal (user ID or system identifier)
 * @property metadata - Additional context about the withdrawal (device info, etc.)
 * @property createdAt - Timestamp with timezone when the withdrawal record was created
 */
export const withdrawals = pgTable(
	'consent_withdrawals',
	{
		id: serial('id').primaryKey(),
		consentId: serial('consent_id')
			.notNull()
			.references(() => consents.id, { onDelete: 'cascade' }),
		revokedAt: timestamp('revoked_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
		revocationReason: text('revocation_reason'),
		method: varchar('method', { length: 50 }).notNull(),
		actor: varchar('actor', { length: 100 }),
		metadata: json('metadata'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			consentIdIdx: index('withdrawal_consent_id_idx').on(table.consentId),
			revokedAtIdx: index('revoked_at_idx').on(table.revokedAt),
		};
	}
);

/**
 * auditLogs - General-purpose audit logging for all consent operations
 *
 * @property id - Internal auto-incrementing primary key
 * @property timestamp - Time with timezone when the audited action occurred
 * @property action - Type of action performed (e.g., 'create_consent', 'update_preferences', 'withdraw_consent')
 * @property userId - User ID associated with this action, if applicable
 * @property resourceType - Type of resource being modified (e.g., 'consents', 'users')
 * @property resourceId - Identifier of the specific resource being modified
 * @property actor - Entity performing the action (user identifier or system name)
 * @property changes - JSON object showing before/after states
 * @property deviceInfo - Information about the device used for this action
 * @property ipAddress - IP address associated with the action (INET type)
 * @property createdAt - Timestamp with timezone when the audit log was created
 */
export const auditLogs = pgTable(
	'consent_audit_logs',
	{
		id: serial('id').primaryKey(),
		timestamp: timestamp('timestamp', { withTimezone: true })
			.defaultNow()
			.notNull(),
		action: varchar('action', { length: 50 }).notNull(),
		userId: uuid('user_id'),
		resourceType: varchar('resource_type', { length: 50 }).notNull(),
		parentDomainId: serial('parent_domain_id').references(() => domains.id),
		resourceId: varchar('resource_id', { length: 100 }).notNull(),
		actor: varchar('actor', { length: 100 }), // Person or system
		changes: json('changes'), // Before/after
		deviceInfo: text('device_info'), // Device information for this action
		ipAddress: inet('ip_address'),
		createdAt: timestamp('created_at', { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			userIdIdx: index('audit_user_id_idx').on(table.userId),
			resourceIdx: index('audit_resource_idx').on(
				table.resourceType,
				table.resourceId
			),
			timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
			actionIdx: index('audit_action_idx').on(table.action), // Added index for action field
		};
	}
);

/**
 * Relationships between tables
 *
 * - users ←→ consents: One-to-many (one user can have many consents)
 * - domains ←→ consents: One-to-many (one domain can have many consents)
 * - consents ←→ records: One-to-many (one consent can have many records)
 * - consents ←→ purposeJunction: One-to-many
 * - consents ←→ withdrawals: One-to-many (one consent can have many withdrawal records)
 * - purposes ←→ purposeJunction: One-to-many
 * - geoLocations ←→ consentGeoLocations: One-to-many
 * - consents ←→ consentGeoLocations: One-to-many
 * - domains: Self-referential for parent/child relationships
 */
export const usersRelations = relations(users, ({ many }) => ({
	consents: many(consents),
}));

export const domainsRelations = relations(domains, ({ many }) => ({
	consents: many(consents),
	// parentDomain: one(domains, {
	// 	fields: [domains.parentDomainId],
	// 	references: [domains.id],
	// }),
	childDomains: many(domains, {
		relationName: 'childDomains',
	}),
}));

export const geoLocationsRelations = relations(geoLocations, ({ many }) => ({
	consentLocations: many(consentGeoLocations),
}));

export const consentsRelations = relations(consents, ({ one, many }) => ({
	user: one(users, {
		fields: [consents.userId],
		references: [users.id],
	}),
	domain: one(domains, {
		fields: [consents.domainId],
		references: [domains.id],
	}),
	records: many(records),
	purposeJunctions: many(purposeJunction),
	geoLocations: many(consentGeoLocations),
	withdrawals: many(withdrawals), // Add relation to withdrawals
}));

export const purposesRelations = relations(purposes, ({ many }) => ({
	consentJunctions: many(purposeJunction),
}));

export const recordsRelations = relations(records, ({ one }) => ({
	consent: one(consents, {
		fields: [records.consentId],
		references: [consents.id],
	}),
}));

export const consentGeoLocationsRelations = relations(
	consentGeoLocations,
	({ one }) => ({
		consent: one(consents, {
			fields: [consentGeoLocations.consentId],
			references: [consents.id],
		}),
		geoLocation: one(geoLocations, {
			fields: [consentGeoLocations.geoLocationId],
			references: [geoLocations.id],
		}),
	})
);

export const purposeJunctionRelations = relations(
	purposeJunction,
	({ one }) => ({
		consent: one(consents, {
			fields: [purposeJunction.consentId],
			references: [consents.id],
		}),
		purpose: one(purposes, {
			fields: [purposeJunction.purposeId],
			references: [purposes.id],
		}),
	})
);

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
	consent: one(consents, {
		fields: [withdrawals.consentId],
		references: [consents.id],
	}),
}));
