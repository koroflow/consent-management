/**
 * @packageDocumentation
 * Provides functionality for fetching consent banner information from the API.
 */

import type { ConsentBannerResponse } from '../types';

// Request tracking to prevent multiple API calls
let consentBannerRequestStatus: 'idle' | 'pending' | 'completed' = 'idle';
let consentBannerRequestPromise: Promise<
	ConsentBannerResponse | undefined
> | null = null;

/**
 * Default consent banner API URL
 */
export const DEFAULT_CONSENT_BANNER_API_URL =
	'https://c15t.com/api/c15t/show-consent-banner';
// '/api/c15t/show-consent-banner';

/**
 * Fetches consent banner information from the API.
 *
 * @param hasConsented - Function to check if user has already consented
 * @param onSuccess - Callback for successful fetch
 * @param onError - Callback for fetch errors
 * @param url - The URL to fetch consent banner information from
 * @returns A promise that resolves with the consent banner response when the fetch is complete, or undefined if it fails
 *
 * @remarks
 * This function:
 * 1. Prevents multiple simultaneous requests
 * 2. Skips fetching if user has already consented
 * 3. Handles errors and provides appropriate callbacks
 */
export const fetchConsentBannerInfo = async (
	hasConsented: () => boolean,
	onSuccess: (data: ConsentBannerResponse) => void,
	onError: (errorMessage: string) => void,
	url: string = DEFAULT_CONSENT_BANNER_API_URL
): Promise<ConsentBannerResponse | undefined> => {
	// Skip if not in browser environment
	if (typeof window === 'undefined') {
		return undefined;
	}

	// Skip if user has already consented
	if (hasConsented()) {
		return undefined;
	}

	// If a request is already pending, return the existing promise
	if (consentBannerRequestStatus === 'pending' && consentBannerRequestPromise) {
		return await consentBannerRequestPromise;
	}

	// If a request has already been completed, don't make another one
	if (consentBannerRequestStatus === 'completed') {
		return undefined;
	}

	// Set request status to pending
	consentBannerRequestStatus = 'pending';

	// Create the request promise
	consentBannerRequestPromise = (async () => {
		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(
					`Failed to fetch consent banner info: ${response.status}`
				);
			}

			const data = (await response.json()) as ConsentBannerResponse;

			// Call success callback
			onSuccess(data);

			// Set request status to completed
			consentBannerRequestStatus = 'completed';

			return data;
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: <explanation>
			console.error('Error fetching consent banner information:', error);

			// Call the onError callback
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Unknown error fetching consent banner information';
			onError(errorMessage);

			// Reset request status to idle so it can be tried again
			consentBannerRequestStatus = 'idle';
			consentBannerRequestPromise = null;

			throw error;
		}
	})();

	return await consentBannerRequestPromise;
};

/**
 * Resets the consent banner request status.
 * Useful for testing or forcing a new request.
 */
export const resetConsentBannerRequestStatus = (): void => {
	consentBannerRequestStatus = 'idle';
	consentBannerRequestPromise = null;
};
