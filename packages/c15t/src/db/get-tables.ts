import type { FieldAttribute } from '.';
import type { C15TOptions } from '~/types';

export type C15TDbSchema = Record<
	string,
	{
		/**
		 * The name of the table in the database
		 */
		modelName: string;
		/**
		 * The fields of the table
		 */
		fields: Record<string, FieldAttribute>;
		/**
		 * Whether to disable migrations for this table
		 * @default false
		 */
		disableMigrations?: boolean;
		/**
		 * The order of the table
		 */
		order?: number;
	}
>;

export const getConsentTables = (options: C15TOptions): C15TDbSchema => {
	const pluginSchema = options.plugins?.reduce(
		(acc, plugin) => {
			const schema = plugin.schema;
			if (!schema) {
				return acc;
			}
			for (const [key, value] of Object.entries(schema)) {
				acc[key] = {
					fields: {
						...acc[key]?.fields,
						...value.fields,
					},
					modelName: value.modelName || key,
				};
			}
			return acc;
		},
		{} as Record<
			string,
			{ fields: Record<string, FieldAttribute>; modelName: string }
		>
	);

	const {
		user,
		consentPurpose,
		consentPolicy,
		domain,
		geoLocation,
		consent,
		consentPurposeJunction,
		consentRecord,
		consentGeoLocation,
		consentWithdrawal,
		consentAuditLog,
		...pluginTables
	} = pluginSchema || {};

	return {
		user: {
			modelName: options.user?.modelName || 'user',
			fields: {
				isIdentified: {
					type: 'boolean',
					defaultValue: () => false,
					required: true,
					fieldName: options.user?.fields?.isIdentified || 'isIdentified',
				},
				externalId: {
					type: 'string',
					required: false,
					fieldName: options.user?.fields?.externalId || 'externalId',
				},
				identityProvider: {
					type: 'string',
					required: false,
					fieldName:
						options.user?.fields?.identityProvider || 'identityProvider',
				},
				lastIpAddress: {
					type: 'string',
					required: false,
					fieldName: options.user?.fields?.lastIpAddress || 'lastIpAddress',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.user?.fields?.createdAt || 'createdAt',
				},
				updatedAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.user?.fields?.updatedAt || 'updatedAt',
				},
				...user?.fields,
				...options.user?.additionalFields,
			},
			order: 1,
		},
		consentPurpose: {
			modelName: options.consentPurpose?.modelName || 'consentPurpose',
			fields: {
				code: {
					type: 'string',
					required: true,
					fieldName: options.consentPurpose?.fields?.code || 'code',
				},
				name: {
					type: 'string',
					required: true,
					fieldName: options.consentPurpose?.fields?.name || 'name',
				},
				description: {
					type: 'string',
					required: true,
					fieldName:
						options.consentPurpose?.fields?.description || 'description',
				},
				isEssential: {
					type: 'boolean',
					defaultValue: () => false,
					required: true,
					fieldName:
						options.consentPurpose?.fields?.isEssential || 'isEssential',
				},
				dataCategory: {
					type: 'string',
					required: false,
					fieldName:
						options.consentPurpose?.fields?.dataCategory || 'dataCategory',
				},
				legalBasis: {
					type: 'string',
					required: false,
					fieldName: options.consentPurpose?.fields?.legalBasis || 'legalBasis',
				},
				isActive: {
					type: 'boolean',
					defaultValue: () => true,
					required: true,
					fieldName: options.consentPurpose?.fields?.isActive || 'isActive',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentPurpose?.fields?.createdAt || 'createdAt',
				},
				updatedAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentPurpose?.fields?.updatedAt || 'updatedAt',
				},
				...consentPurpose?.fields,
				...options.consentPurpose?.additionalFields,
			},
			order: 2,
		},
		consentPolicy: {
			modelName: options.consentPolicy?.modelName || 'consentPolicy',
			fields: {
				version: {
					type: 'string',
					required: true,
					fieldName: options.consentPolicy?.fields?.version || 'version',
				},
				name: {
					type: 'string',
					required: true,
					fieldName: options.consentPolicy?.fields?.name || 'name',
				},
				effectiveDate: {
					type: 'date',
					required: true,
					fieldName:
						options.consentPolicy?.fields?.effectiveDate || 'effectiveDate',
				},
				expirationDate: {
					type: 'date',
					required: false,
					fieldName:
						options.consentPolicy?.fields?.expirationDate || 'expirationDate',
				},
				content: {
					type: 'string',
					required: true,
					fieldName: options.consentPolicy?.fields?.content || 'content',
				},
				contentHash: {
					type: 'string',
					required: true,
					fieldName:
						options.consentPolicy?.fields?.contentHash || 'contentHash',
				},
				isActive: {
					type: 'boolean',
					defaultValue: () => true,
					required: true,
					fieldName: options.consentPolicy?.fields?.isActive || 'isActive',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentPolicy?.fields?.createdAt || 'createdAt',
				},
				...consentPolicy?.fields,
				...options.consentPolicy?.additionalFields,
			},
			order: 3,
		},
		domain: {
			modelName: options.domain?.modelName || 'domain',
			fields: {
				domain: {
					type: 'string',
					required: true,
					fieldName: options.domain?.fields?.domain || 'domain',
				},
				isPattern: {
					type: 'boolean',
					defaultValue: () => false,
					required: true,
					fieldName: options.domain?.fields?.isPattern || 'isPattern',
				},
				patternType: {
					type: 'string',
					required: false,
					fieldName: options.domain?.fields?.patternType || 'patternType',
				},
				parentDomainId: {
					type: 'number',
					required: false,
					fieldName: options.domain?.fields?.parentDomainId || 'parentDomainId',
					references: {
						model: options.domain?.modelName || 'domain',
						field: 'id',
						onDelete: 'set null',
					},
				},
				description: {
					type: 'string',
					required: false,
					fieldName: options.domain?.fields?.description || 'description',
				},
				isActive: {
					type: 'boolean',
					defaultValue: () => true,
					required: true,
					fieldName: options.domain?.fields?.isActive || 'isActive',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.domain?.fields?.createdAt || 'createdAt',
				},
				updatedAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.domain?.fields?.updatedAt || 'updatedAt',
				},
				...domain?.fields,
				...options.domain?.additionalFields,
			},
			order: 4,
		},
		geoLocation: {
			modelName: options.geoLocation?.modelName || 'geoLocation',
			fields: {
				countryCode: {
					type: 'string',
					required: true,
					fieldName: options.geoLocation?.fields?.countryCode || 'countryCode',
				},
				countryName: {
					type: 'string',
					required: true,
					fieldName: options.geoLocation?.fields?.countryName || 'countryName',
				},
				regionCode: {
					type: 'string',
					required: false,
					fieldName: options.geoLocation?.fields?.regionCode || 'regionCode',
				},
				regionName: {
					type: 'string',
					required: false,
					fieldName: options.geoLocation?.fields?.regionName || 'regionName',
				},
				regulatoryZones: {
					// 	type: 'json',
					type: 'string',
					required: false,
					fieldName:
						options.geoLocation?.fields?.regulatoryZones || 'regulatoryZones',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.geoLocation?.fields?.createdAt || 'createdAt',
				},
				...geoLocation?.fields,
				...options.geoLocation?.additionalFields,
			},
			order: 5,
		},
		consent: {
			modelName: options.consent?.modelName || 'consent',
			fields: {
				userId: {
					type: 'string',
					required: true,
					fieldName: options.consent?.fields?.userId || 'userId',
					references: {
						model: options.user?.modelName || 'user',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				domainId: {
					type: 'number',
					required: true,
					fieldName: options.consent?.fields?.domainId || 'domainId',
					references: {
						model: options.domain?.modelName || 'domain',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				preferences: {
					type: 'string[]',
					required: true,
					fieldName: options.consent?.fields?.preferences || 'preferences',
				},
				metadata: {
					type: 'string[]',
					required: true,
					fieldName: options.consent?.fields?.metadata || 'metadata',
				},
				policyId: {
					type: 'number',
					required: true,
					fieldName: options.consent?.fields?.policyId || 'policyId',
					references: {
						model: options.consentPolicy?.modelName || 'consentPolicy',
						field: 'id',
						onDelete: 'restrict',
					},
				},
				ipAddress: {
					type: 'string',
					required: false,
					fieldName: options.consent?.fields?.ipAddress || 'ipAddress',
				},
				region: {
					type: 'string',
					required: false,
					fieldName: options.consent?.fields?.region || 'region',
				},
				givenAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consent?.fields?.givenAt || 'givenAt',
				},
				validUntil: {
					type: 'date',
					required: false,
					fieldName: options.consent?.fields?.validUntil || 'validUntil',
				},
				isActive: {
					type: 'boolean',
					defaultValue: () => true,
					required: true,
					fieldName: options.consent?.fields?.isActive || 'isActive',
				},
				...consent?.fields,
				...options.consent?.additionalFields,
			},
			order: 6,
		},
		consentPurposeJunction: {
			modelName:
				options.consentPurposeJunction?.modelName || 'consentPurposeJunction',
			fields: {
				consentId: {
					type: 'number',
					required: true,
					fieldName:
						options.consentPurposeJunction?.fields?.consentId || 'consentId',
					references: {
						model: options.consent?.modelName || 'consent',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				purposeId: {
					type: 'number',
					required: true,
					fieldName:
						options.consentPurposeJunction?.fields?.purposeId || 'purposeId',
					references: {
						model: options.consentPurpose?.modelName || 'consentPurpose',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				isAccepted: {
					type: 'boolean',
					required: true,
					fieldName:
						options.consentPurposeJunction?.fields?.isAccepted || 'isAccepted',
				},
				...consentPurposeJunction?.fields,
				...options.consentPurposeJunction?.additionalFields,
			},
			order: 7,
		},
		consentRecord: {
			modelName: options.consentRecord?.modelName || 'consentRecord',
			fields: {
				consentId: {
					type: 'number',
					required: true,
					fieldName: options.consentRecord?.fields?.consentId || 'consentId',
					references: {
						model: options.consent?.modelName || 'consent',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				recordType: {
					type: 'string',
					required: true,
					fieldName: options.consentRecord?.fields?.recordType || 'recordType',
				},
				recordTypeDetail: {
					type: 'string',
					required: false,
					fieldName:
						options.consentRecord?.fields?.recordTypeDetail ||
						'recordTypeDetail',
				},
				content: {
					type: 'string[]',
					required: true,
					fieldName: options.consentRecord?.fields?.content || 'content',
				},
				ipAddress: {
					type: 'string',
					required: false,
					fieldName: options.consentRecord?.fields?.ipAddress || 'ipAddress',
				},
				recordMetadata: {
					type: 'string[]',
					required: false,
					fieldName:
						options.consentRecord?.fields?.recordMetadata || 'recordMetadata',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentRecord?.fields?.createdAt || 'createdAt',
				},
				...consentRecord?.fields,
				...options.consentRecord?.additionalFields,
			},
			order: 8,
		},
		consentGeoLocation: {
			modelName: options.consentGeoLocation?.modelName || 'consentGeoLocation',
			fields: {
				consentId: {
					type: 'number',
					required: true,
					fieldName:
						options.consentGeoLocation?.fields?.consentId || 'consentId',
					references: {
						model: options.consent?.modelName || 'consent',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				geoLocationId: {
					type: 'number',
					required: true,
					fieldName:
						options.consentGeoLocation?.fields?.geoLocationId ||
						'geoLocationId',
					references: {
						model: options.geoLocation?.modelName || 'geoLocation',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName:
						options.consentGeoLocation?.fields?.createdAt || 'createdAt',
				},
				...consentGeoLocation?.fields,
				...options.consentGeoLocation?.additionalFields,
			},
			order: 9,
		},
		consentWithdrawal: {
			modelName: options.consentWithdrawal?.modelName || 'consentWithdrawal',
			fields: {
				consentId: {
					type: 'number',
					required: true,
					fieldName:
						options.consentWithdrawal?.fields?.consentId || 'consentId',
					references: {
						model: options.consent?.modelName || 'consent',
						field: 'id',
						onDelete: 'cascade',
					},
				},
				revokedAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName:
						options.consentWithdrawal?.fields?.revokedAt || 'revokedAt',
				},
				revocationReason: {
					type: 'string',
					required: false,
					fieldName:
						options.consentWithdrawal?.fields?.revocationReason ||
						'revocationReason',
				},
				method: {
					type: 'string',
					required: true,
					fieldName: options.consentWithdrawal?.fields?.method || 'method',
				},
				actor: {
					type: 'string',
					required: false,
					fieldName: options.consentWithdrawal?.fields?.actor || 'actor',
				},
				metadata: {
					type: 'string[]',
					required: false,
					fieldName: options.consentWithdrawal?.fields?.metadata || 'metadata',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName:
						options.consentWithdrawal?.fields?.createdAt || 'createdAt',
				},
				...consentWithdrawal?.fields,
				...options.consentWithdrawal?.additionalFields,
			},
			order: 10,
		},
		consentAuditLog: {
			modelName: options.consentAuditLog?.modelName || 'consentAuditLog',
			fields: {
				timestamp: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentAuditLog?.fields?.timestamp || 'timestamp',
				},
				action: {
					type: 'string',
					required: true,
					fieldName: options.consentAuditLog?.fields?.action || 'action',
				},
				userId: {
					type: 'string',
					required: false,
					fieldName: options.consentAuditLog?.fields?.userId || 'userId',
					references: {
						model: options.user?.modelName || 'user',
						field: 'id',
						onDelete: 'set null',
					},
				},
				resourceType: {
					type: 'string',
					required: true,
					fieldName:
						options.consentAuditLog?.fields?.resourceType || 'resourceType',
				},
				resourceId: {
					type: 'string',
					required: true,
					fieldName:
						options.consentAuditLog?.fields?.resourceId || 'resourceId',
				},
				actor: {
					type: 'string',
					required: false,
					fieldName: options.consentAuditLog?.fields?.actor || 'actor',
				},
				changes: {
					type: 'string[]',
					required: false,
					fieldName: options.consentAuditLog?.fields?.changes || 'changes',
				},
				deviceInfo: {
					type: 'string',
					required: false,
					fieldName:
						options.consentAuditLog?.fields?.deviceInfo || 'deviceInfo',
				},
				ipAddress: {
					type: 'string',
					required: false,
					fieldName: options.consentAuditLog?.fields?.ipAddress || 'ipAddress',
				},
				createdAt: {
					type: 'date',
					defaultValue: () => new Date(),
					required: true,
					fieldName: options.consentAuditLog?.fields?.createdAt || 'createdAt',
				},
				...consentAuditLog?.fields,
				...options.consentAuditLog?.additionalFields,
			},
			order: 11,
		},
		...pluginTables,
	} satisfies C15TDbSchema;
};
