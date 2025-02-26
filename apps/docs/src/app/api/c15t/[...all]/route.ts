import { c15tMiddleware, toNextJsHandler } from '@c15t/middleware';

// Mock data for testing different jurisdictions and locations
const mockResponses = [
	{
		showConsentBanner: true,
		jurisdiction: {
			code: 'GDPR',
			message: 'GDPR or equivalent regulations require a cookie banner.',
		},
		location: {
			countryCode: 'GB',
			regionCode: 'ENG',
		},
	},
	{
		showConsentBanner: false,
		jurisdiction: {
			code: 'NONE',
			message: 'No specific requirements',
		},
		location: {
			countryCode: 'US',
			regionCode: 'NY',
		},
	},
	{
		showConsentBanner: false,
		jurisdiction: {
			code: 'NONE',
			message: 'No specific requirements',
		},
		location: {
			countryCode: 'US',
			regionCode: 'CA',
		},
	},
	{
		showConsentBanner: true,
		jurisdiction: {
			code: 'GDPR',
			message: 'GDPR or equivalent regulations require a cookie banner.',
		},
		location: {
			countryCode: 'DE',
			regionCode: 'HE',
		},
	},
];

// Mock GET handler
const mockHandler = () => {
	const response = mockResponses[1];

	// return new Response('Unauthorized', { status: 401 });

	return Response.json(response);
};

// Toggle between real and mock handlers
const USE_MOCKS = false;

export const { GET, POST } = USE_MOCKS
	? { GET: mockHandler, POST: mockHandler }
	: toNextJsHandler(c15tMiddleware().handler);
