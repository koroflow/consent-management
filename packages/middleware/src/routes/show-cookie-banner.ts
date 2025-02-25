import { createEndpoint } from 'better-call';

export const showCookieBanner = createEndpoint(
	'/show-cookie-banner',
	{
		method: 'GET',
		metadata: {
			openapi: {
				responses: {
					'200': {
						description: 'Cookie Banner Requirement',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										showCookieBanner: { type: 'boolean' },
										jurisdictionCode: { type: 'string' },
										message: { type: 'string' },
										regionCode: { type: 'string' },
									},
								},
							},
						},
					},
				},
			},
		},
	},
	// biome-ignore lint/suspicious/useAwait: This is a middleware function, so it's okay to use await
	async (c) => {
		const countryCode =
			c.headers?.get('cf-ipcountry') ||
			c.headers?.get('x-vercel-ip-country') ||
			c.headers?.get('x-amz-cf-ipcountry') ||
			c.headers?.get('x-country-code');

		const regionCode =
			c.headers?.get('x-vercel-ip-country-region') ||
			c.headers?.get('x-region-code');
		const { showCookieBanner, jurisdictionCode, message } = checkJurisdiction(
			countryCode ?? null
		);

		return { showCookieBanner, jurisdictionCode, message, regionCode };
	}
);

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a complex function, but it's necessary to check the jurisdiction of the user
function checkJurisdiction(countryCode: string | null) {
	const jurisdictions = {
		EU: new Set([
			'AT',
			'BE',
			'BG',
			'HR',
			'CY',
			'CZ',
			'DK',
			'EE',
			'FI',
			'FR',
			'DE',
			'GR',
			'HU',
			'IE',
			'IT',
			'LV',
			'LT',
			'LU',
			'MT',
			'NL',
			'PL',
			'PT',
			'RO',
			'SK',
			'SI',
			'ES',
			'SE',
		]),
		EEA: new Set(['IS', 'NO', 'LI']),
		UK: new Set(['GB']),
		CH: new Set(['CH']),
		BR: new Set(['BR']),
		CA: new Set(['CA']),
		AU: new Set(['AU']),
		JP: new Set(['JP']),
		KR: new Set(['KR']),
	};

	let showCookieBanner = false;
	let jurisdictionCode = 'NONE';
	let message = 'No specific requirements';

	if (countryCode) {
		if (
			jurisdictions.EU.has(countryCode) ||
			jurisdictions.EEA.has(countryCode) ||
			jurisdictions.UK.has(countryCode)
		) {
			showCookieBanner = true;
			jurisdictionCode = 'GDPR';
			message = 'GDPR or equivalent regulations require a cookie banner.';
		} else if (jurisdictions.CH.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'CH';
			message = 'Switzerland requires similar data protection measures.';
		} else if (jurisdictions.BR.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'BR';
			message = "Brazil's LGPD requires consent for cookies.";
		} else if (jurisdictions.CA.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'PIPEDA';
			message = 'PIPEDA requires consent for data collection.';
		} else if (jurisdictions.AU.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'AU';
			message =
				"Australia's Privacy Act mandates transparency about data collection.";
		} else if (jurisdictions.JP.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'APPI';
			message = "Japan's APPI requires consent for data collection.";
		} else if (jurisdictions.KR.has(countryCode)) {
			showCookieBanner = true;
			jurisdictionCode = 'PIPA';
			message = "South Korea's PIPA requires consent for data collection.";
		}
	}

	return { showCookieBanner, jurisdictionCode, message };
}
