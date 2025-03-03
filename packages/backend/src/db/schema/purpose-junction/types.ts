import type { BaseEntityConfig } from '../types';

/**
 * Purpose junction entity configuration
 * @default entityName: "purposeJunction", entityPrefix: "pjx"
 */
export interface PurposeJunctionEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		consentId?: string;
		purposeId?: string;
		isAccepted?: string;
	};
}
