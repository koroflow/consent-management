import { z } from 'zod';
import type { FieldAttribute } from '.';
import type { C15TPluginSchema } from '~/types';
import type { C15TOptions } from '~/types';
import { APIError } from 'better-call';
import type {
	User,
	Consent,
	ConsentPurpose,
	ConsentRecord,
	ConsentGeoLocation,
	ConsentWithdrawal,
	ConsentAuditLog,
} from '~/types';

// New consent-related schemas based on the Drizzle schema definitions

export const consentRecordTypeEnum = z.enum([
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

export const userSchema = z.object({
	id: z.string().uuid(),
	isIdentified: z.boolean().default(false),
	externalId: z.string().optional(),
	identityProvider: z.string().optional(),
	lastIpAddress: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const consentPurposeSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	description: z.string(),
	isEssential: z.boolean().default(false),
	dataCategory: z.string().optional(),
	legalBasis: z.string().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const consentPolicySchema = z.object({
	id: z.string(),
	version: z.string(),
	name: z.string(),
	effectiveDate: z.date(),
	expirationDate: z.date().optional(),
	content: z.string(),
	contentHash: z.string(),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
});

export const domainSchema = z.object({
	id: z.string(),
	domain: z.string(),
	isPattern: z.boolean().default(false),
	patternType: z.string().optional(),
	parentDomainId: z.number().optional(),
	description: z.string().optional(),
	isActive: z.boolean().default(true),
	createdAt: z.date().default(() => new Date()),
	updatedAt: z.date().default(() => new Date()),
});

export const geoLocationSchema = z.object({
	id: z.string(),
	countryCode: z.string(),
	countryName: z.string(),
	regionCode: z.string().optional(),
	regionName: z.string().optional(),
	regulatoryZones: z.array(z.string()).optional(),
	createdAt: z.date().default(() => new Date()),
});

export const consentSchema = z.object({
	id: z.string(),
	userId: z.string().uuid(),
	domainId: z.string(),
	preferences: z.record(z.string(), z.boolean()),
	metadata: z.record(z.string(), z.unknown()),
	policyId: z.string(),
	ipAddress: z.string().optional(),
	region: z.string().optional(),
	givenAt: z.date().default(() => new Date()),
	validUntil: z.date().optional(),
	isActive: z.boolean().default(true),
});

export const consentPurposeJunctionSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	purposeId: z.string(),
	isAccepted: z.boolean(),
});

export const consentRecordSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	recordType: consentRecordTypeEnum,
	recordTypeDetail: z.string().optional(),
	content: z.record(z.string(), z.unknown()),
	ipAddress: z.string().optional(),
	recordMetadata: z.record(z.string(), z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

export const consentGeoLocationSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	geoLocationId: z.string(),
	createdAt: z.date().default(() => new Date()),
});

export const consentWithdrawalSchema = z.object({
	id: z.string(),
	consentId: z.string(),
	revokedAt: z.date().default(() => new Date()),
	revocationReason: z.string().optional(),
	method: z.string(),
	actor: z.string().optional(),
	metadata: z.record(z.string(), z.unknown()).optional(),
	createdAt: z.date().default(() => new Date()),
});

export const consentAuditLogSchema = z.object({
	id: z.string(),
	timestamp: z.date().default(() => new Date()),
	action: z.string(),
	userId: z.string().uuid().optional(),
	resourceType: z.string(),
	resourceId: z.string(),
	actor: z.string().optional(),
	changes: z.record(z.string(), z.unknown()).optional(),
	deviceInfo: z.string().optional(),
	ipAddress: z.string().optional(),
	createdAt: z.date().default(() => new Date()),
});

export function parseOutputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, FieldAttribute>;
	}
) {
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const key in data) {
		const field = fields[key];
		if (!field) {
			parsedData[key] = data[key];
			continue;
		}
		if (field.returned === false) {
			continue;
		}
		parsedData[key] = data[key];
	}
	return parsedData as T;
}

export function getAllFields(options: C15TOptions, table: string) {
	let schema: Record<string, FieldAttribute> = {
		...(table === 'user' && options.user?.additionalFields
			? options.user.additionalFields
			: {}),
		...(table === 'consent' && options.consent?.additionalFields
			? options.consent.additionalFields
			: {}),
	};
	for (const plugin of options.plugins || []) {
		const pluginSchema = plugin.schema as C15TPluginSchema | undefined;
		if (pluginSchema?.[table]) {
			schema = {
				...schema,
				...pluginSchema[table].fields,
			};
		}
	}
	return schema;
}

export function parseUserOutput(options: C15TOptions, user: User) {
	const schema = getAllFields(options, 'user');
	return parseOutputData(user, { fields: schema });
}

export function parseConsentOutput(options: C15TOptions, consent: Consent) {
	const schema = getAllFields(options, 'consent');
	return parseOutputData(consent, { fields: schema });
}

export function parseConsentPurposeOutput(
	options: C15TOptions,
	purpose: ConsentPurpose
) {
	const schema = getAllFields(options, 'consentPurpose');
	return parseOutputData(purpose, { fields: schema });
}

export function parseConsentRecordOutput(
	options: C15TOptions,
	record: ConsentRecord
) {
	const schema = getAllFields(options, 'consentRecord');
	return parseOutputData(record, { fields: schema });
}

export function parseConsentGeoLocationOutput(
	options: C15TOptions,
	location: ConsentGeoLocation
) {
	const schema = getAllFields(options, 'consentGeoLocation');
	return parseOutputData(location, { fields: schema });
}

export function parseConsentWithdrawalOutput(
	options: C15TOptions,
	withdrawal: ConsentWithdrawal
) {
	const schema = getAllFields(options, 'consentWithdrawal');
	return parseOutputData(withdrawal, { fields: schema });
}

export function parseConsentAuditLogOutput(
	options: C15TOptions,
	auditLog: ConsentAuditLog
) {
	const schema = getAllFields(options, 'consentAuditLog');
	return parseOutputData(auditLog, { fields: schema });
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export function parseInputData<T extends Record<string, unknown>>(
	data: T,
	schema: {
		fields: Record<string, FieldAttribute>;
		action?: 'create' | 'update';
	}
) {
	const action = schema.action || 'create';
	const fields = schema.fields;
	const parsedData: Record<string, unknown> = {};
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const key in fields) {
		if (key in data) {
			if (fields[key]?.input === false) {
				if (fields[key]?.defaultValue) {
					parsedData[key] = fields[key]?.defaultValue;
					continue;
				}
				continue;
			}
			if (fields[key]?.validator?.input && data[key] !== undefined) {
				parsedData[key] = fields[key]?.validator?.input.parse(data[key]);
				continue;
			}
			if (fields[key]?.transform?.input && data[key] !== undefined) {
				const inputValue = data[key] as string | number | boolean | null;
				parsedData[key] = fields[key]?.transform?.input(inputValue);
				continue;
			}
			parsedData[key] = data[key];
			continue;
		}

		if (fields[key]?.defaultValue && action === 'create') {
			parsedData[key] = fields[key]?.defaultValue;
			continue;
		}

		if (fields[key]?.required && action === 'create') {
			throw new APIError('BAD_REQUEST', {
				message: `${key} is required`,
			});
		}
	}
	return parsedData as Partial<T>;
}

export function parseUserInput(
	options: C15TOptions,
	user?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'user');
	return parseInputData(user || {}, { fields: schema, action });
}

export function parseConsentInput(
	options: C15TOptions,
	consent?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consent');
	return parseInputData(consent || {}, { fields: schema, action });
}

export function parseConsentPurposeInput(
	options: C15TOptions,
	purpose?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentPurpose');
	return parseInputData(purpose || {}, { fields: schema, action });
}

export function parseConsentRecordInput(
	options: C15TOptions,
	record?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentRecord');
	return parseInputData(record || {}, { fields: schema, action });
}

export function parseConsentGeoLocationInput(
	options: C15TOptions,
	location?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentGeoLocation');
	return parseInputData(location || {}, { fields: schema, action });
}

export function parseConsentWithdrawalInput(
	options: C15TOptions,
	withdrawal?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentWithdrawal');
	return parseInputData(withdrawal || {}, { fields: schema, action });
}

export function parseConsentAuditLogInput(
	options: C15TOptions,
	auditLog?: Record<string, unknown>,
	action?: 'create' | 'update'
) {
	const schema = getAllFields(options, 'consentAuditLog');
	return parseInputData(auditLog || {}, { fields: schema, action });
}

export function mergeSchema<S extends C15TPluginSchema>(
	schema: S,
	newSchema?: {
		[K in keyof S]?: {
			modelName?: string;
			fields?: {
				[P: string]: string;
			};
		};
	}
) {
	if (!newSchema) {
		return schema;
	}
	// biome-ignore lint/nursery/useGuardForIn: <explanation>
	for (const table in newSchema) {
		const newModelName = newSchema[table]?.modelName;
		if (newModelName && schema[table]) {
			schema[table].modelName = newModelName;
		}
		// biome-ignore lint/nursery/useGuardForIn: <explanation>
		for (const field in schema[table]?.fields || {}) {
			const newField = newSchema[table]?.fields?.[field];
			if (!newField) {
				continue;
			}
			if (schema[table]?.fields) {
				const fields = schema[table].fields;
				if (fields?.[field]) {
					fields[field].fieldName = newField;
				}
			}
		}
	}
	return schema;
}
