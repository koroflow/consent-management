import type { BaseEntityConfig } from '../types';

/**
 * Consent policy entity configuration
 * @default entityName: "consentPolicy", entityPrefix: "pol"
 */
export interface ConsentPolicyEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		version?: string;
		name?: string;
		effectiveDate?: string;
		expirationDate?: string;
		content?: string;
		contentHash?: string;
		isActive?: string;
		createdAt?: string;
	};
}
