import type { BaseEntityConfig } from '../types';

/**
 * Withdrawal entity configuration
 * @default entityName: "withdrawal", entityPrefix: "wdr"
 */
export interface WithdrawalEntityConfig extends BaseEntityConfig {
	fields?: Record<string, string> & {
		id?: string;
		consentId?: string;
		revokedAt?: string;
		revocationReason?: string;
		method?: string;
		actor?: string;
		metadata?: string;
		createdAt?: string;
	};

	/**
	 * Prevent multiple withdrawals for the same consent
	 *
	 * If true, a user can only have one withdrawal record per consent,
	 * preventing multiple revocation records for the same consent.
	 * This helps maintain data integrity and clearer consent history.
	 *
	 * @default false
	 */
	preventMultipleWithdrawals?: boolean;
}
