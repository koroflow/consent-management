import type { C15TOptions } from './options';
import type {
	consentSchema,
	userSchema,
	consentPurposeSchema,
	consentRecordSchema,
	consentGeoLocationSchema,
	consentWithdrawalSchema,
	consentAuditLogSchema,
	consentPolicySchema,
	domainSchema,
} from '../db/schema';
import type { C15TInstance } from '../core';
import type { InferFieldsFromOptions, InferFieldsFromPlugins } from '../db';
import type { StripEmptyObjects, UnionToIntersection } from './helper';
import type { z } from 'zod';

export type Models =
	| 'consent'
	| 'consentPurpose'
	| 'consentRecord'
	| 'consentGeoLocation'
	| 'consentWithdrawal'
	| 'consentAuditLog'
	| 'consentPolicy'
	| 'domain'
	| 'user';

export type AdditionalUserFieldsInput<Options extends C15TOptions> =
	InferFieldsFromPlugins<Options, 'user', 'input'> &
		InferFieldsFromOptions<Options, 'user', 'input'>;

export type AdditionalUserFieldsOutput<Options extends C15TOptions> =
	InferFieldsFromPlugins<Options, 'user'> &
		InferFieldsFromOptions<Options, 'user'>;

export type InferUser<O extends C15TOptions | C15TInstance> =
	UnionToIntersection<
		StripEmptyObjects<
			User &
				(O extends C15TOptions
					? AdditionalUserFieldsOutput<O>
					: O extends C15TInstance
						? AdditionalUserFieldsOutput<O['options']>
						: Record<string, never>)
		>
	>;

export type Consent = z.infer<typeof consentSchema>;
export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;
export type ConsentRecord = z.infer<typeof consentRecordSchema>;
export type ConsentGeoLocation = z.infer<typeof consentGeoLocationSchema>;
export type ConsentWithdrawal = z.infer<typeof consentWithdrawalSchema>;
export type ConsentAuditLog = z.infer<typeof consentAuditLogSchema>;
export type User = z.infer<typeof userSchema>;
export type ConsentDomain = z.infer<typeof domainSchema>;
export type ConsentPolicy = z.infer<typeof consentPolicySchema>;
