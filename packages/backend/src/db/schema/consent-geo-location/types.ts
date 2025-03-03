import type { BaseEntityConfig } from '../types';

/**
 * Consent geo location entity configuration
 * @default entityName: "consentGeoLocation", entityPrefix: "cgl"
 */
export interface ConsentGeoLocationEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		consentId?: string;
		geoLocationId?: string;
		createdAt?: string;
	};
}
