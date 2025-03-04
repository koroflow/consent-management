import { generateConsentReceipt } from './generate-consent-receipt';
import { getConsent } from './get-consent';
import { getConsentHistory } from './get-consent-history';
import { getConsentPolicy } from './get-consent-policy';
import { setConsent } from './set-consent';
import { showConsentBanner } from './show-consent-banner';
import { status } from './status';
import { verifyConsent } from './verify-consent';
import { withdrawConsent } from './withdraw-consent';
export * from './error';
export * from './ok';

export const baseEndpoints = {
	generateConsentReceipt,
	getConsentHistory,
	getConsentPolicy,
	getConsent,
	setConsent,
	showConsentBanner,
	status,
	verifyConsent,
	withdrawConsent,
};
