import type { CoreTableName } from '../schema/types';

/**
 * Type guard to check if a table name is a core table
 */
export function isCoreTable(name: string): name is CoreTableName {
	return [
		'user',
		'consent',
		'purpose',
		'consentPolicy',
		'domain',
		'purposeJunction',
		'record',
		'consentGeoLocation',
		'withdrawal',
		'auditLog',
	].includes(name);
}
