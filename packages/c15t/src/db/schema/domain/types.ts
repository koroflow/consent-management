import type { ActiveEntityConfig } from '../types';

/**
 * Domain entity configuration
 * @default entityName: "domain", entityPrefix: "dom"
 */
export interface DomainEntityConfig extends ActiveEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		domain?: string;
		isPattern?: string;
		patternType?: string;
		parentDomainId?: string;
		description?: string;
		isActive?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}
