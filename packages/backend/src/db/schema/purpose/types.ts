import type { ActiveEntityConfig } from '../types';

/**
 * Purpose entity configuration
 * @default entityName: "purpose", entityPrefix: "pur"
 */
export interface PurposeEntityConfig extends ActiveEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		name?: string;
		description?: string;
		isActive?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}
