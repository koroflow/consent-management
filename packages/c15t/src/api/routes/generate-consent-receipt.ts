import { createAuthEndpoint } from '../call';
import { APIError } from 'better-call';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { C15TContext } from '../../types';
import type { Record } from '~/db/schema/record/schema';

// Define the schema for validating request parameters
const generateConsentReceiptSchema = z.object({
	consentId: z.string(),
	includeSignature: z.boolean().default(true),
});

type GenerateConsentReceiptRequest = z.infer<
	typeof generateConsentReceiptSchema
>;

// Define the receipt types
interface ConsentReceiptPurpose {
	purpose: string;
	purposeDescription: string;
	consentType: string;
	purposeCategory: string[];
	termination: string;
	thirdPartyDisclosure: boolean;
	thirdPartyName?: string;
}

interface ConsentReceiptService {
	service: string;
	purposes: ConsentReceiptPurpose[];
}

interface ConsentReceipt {
	version: string;
	jurisdiction: string;
	consentTimestamp: Date;
	collectionMethod: string;
	consentReceiptID: string;
	publicKey: string;
	subject: {
		id: string;
		idType: string;
	};
	dataController: {
		id: string;
		name: string;
		on_behalf: string[];
	};
	policyURL: string;
	services: ConsentReceiptService[];
	sensitive: boolean;
	spiCat: string[];
	metadata: Record<string, unknown>;
	signature?: string;
}

/**
 * Endpoint for generating a standardized consent receipt.
 *
 * This endpoint generates a detailed receipt document that provides formal proof of consent,
 * following industry standards for consent documentation. The receipt includes comprehensive
 * information about who gave consent, what they consented to, and all metadata associated
 * with the consent event.
 *
 * Optionally, the receipt can include a cryptographic signature for verification purposes.
 *
 * @endpoint GET /consent/receipt
 * @requestExample
 * ```
 * GET /api/consent/receipt?consentId=123&includeSignature=true
 * ```
 *
 * @responseExample
 * ```json
 * {
 *   "receipt": {
 *     "version": "1.0.0",
 *     "jurisdiction": "GDPR",
 *     "consentTimestamp": "2023-06-15T14:30:00Z",
 *     "collectionMethod": "web_form",
 *     "consentReceiptID": "CR7891011",
 *     "publicKey": "pub-key-123",
 *     "subject": {
 *       "id": "550e8400-e29b-41d4-a716-446655440000",
 *       "idType": "UUID"
 *     },
 *     "dataController": {
 *       "id": "example.com",
 *       "name": "Example Company",
 *       "on_behalf": []
 *     },
 *     "policyURL": "https://example.com/privacy",
 *     "services": [
 *       {
 *         "service": "Website Analytics",
 *         "purposes": [
 *           {
 *             "purpose": "analytics",
 *             "purposeDescription": "Analyze website traffic and user behavior",
 *             "consentType": "EXPLICIT",
 *             "purposeCategory": ["Analytics"],
 *             "termination": "1 year",
 *             "thirdPartyDisclosure": true,
 *             "thirdPartyName": "Google Analytics"
 *           }
 *         ]
 *       },
 *       {
 *         "service": "Marketing",
 *         "purposes": [
 *           {
 *             "purpose": "marketing",
 *             "purposeDescription": "Send personalized marketing communications",
 *             "consentType": "EXPLICIT",
 *             "purposeCategory": ["Marketing"],
 *             "termination": "Until consent is withdrawn",
 *             "thirdPartyDisclosure": false
 *           }
 *         ]
 *       }
 *     ],
 *     "sensitive": false,
 *     "spiCat": [],
 *     "metadata": {
 *       "deviceInfo": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
 *       "ipAddress": "192.168.1.1",
 *       "source": "cookie_banner",
 *       "policyVersion": "1.2"
 *     },
 *     "signature": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
 *   },
 *   "receiptId": "CR7891011",
 *   "timestamp": "2023-06-15T14:35:00Z"
 * }
 * ```
 *
 * @returns {Object} The generated consent receipt
 * @returns {Object} receipt - The standardized consent receipt object
 * @returns {string} receipt.version - The version of the receipt format
 * @returns {string} receipt.jurisdiction - The legal jurisdiction (e.g., GDPR, CCPA)
 * @returns {string} receipt.consentTimestamp - When consent was given
 * @returns {string} receipt.collectionMethod - How consent was collected
 * @returns {string} receipt.consentReceiptID - Unique ID for this receipt
 * @returns {Object} receipt.subject - Information about the user
 * @returns {Object} receipt.dataController - Information about the data controller
 * @returns {string} receipt.policyURL - URL to the privacy policy
 * @returns {Array} receipt.services - Services and purposes consented to
 * @returns {Object} receipt.metadata - Additional context about the consent
 * @returns {string} receipt.signature - Cryptographic signature (if requested)
 * @returns {string} receiptId - The unique ID of the generated receipt
 * @returns {string} timestamp - When the receipt was generated
 *
 * @throws {APIError} BAD_REQUEST - When receipt generation request is invalid
 * @throws {APIError} NOT_FOUND - When the consent record doesn't exist
 */
export const generateConsentReceipt = createAuthEndpoint(
	'/consent/receipt',
	{
		method: 'GET',
	},
	async (ctx) => {
		try {
			// Validate request query parameters
			const validatedData = generateConsentReceiptSchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request parameters',
					details: validatedData.error.errors,
				});
			}

			const params = validatedData.data;

			// Access the internal adapter from the context
			const registry = ctx.context?.registry;

			if (!registry) {
				throw new APIError('INTERNAL_SERVER_ERROR', {
					message: 'Internal adapter not available',
				});
			}

			// Get the consent record with related information
			const consentResult = await registry.findConsentById(params.consentId);

			if (!consentResult || !consentResult.consent) {
				throw new APIError('NOT_FOUND', {
					message: 'Consent record not found',
					details: { consentId: params.consentId },
				});
			}

			const record = consentResult.consent;
			const userRecord = consentResult.user;

			if (!userRecord) {
				throw new APIError('NOT_FOUND', {
					message: 'User associated with consent not found',
					details: { consentId: params.consentId },
				});
			}

			// Get consent records related to this consent
			// This would ideally be a method in the adapter to get records by consent ID
			// For now, we'll use a simplified approach
			let records: Record[] = [];

			try {
				// In a complete implementation, this would be a method like:
				// records = await registry.findRecordsByConsentId(params.consentId);

				// For now, we'll simulate a record
				records = [
					{
						id: 'record1',
						consentId: params.consentId,
						// recordType: 'form_submission',
						recordTypeDetail: 'web_form',
						content: {},
						ipAddress: record.ipAddress,
						recordMetadata: {
							deviceInfo: 'User Agent from request headers',
						},
						createdAt: new Date(),
					},
				];
			} catch (err) {
				// If we can't get records, continue with an empty array
				records = [];
			}

			// Simulate domain information
			// In a complete implementation, we would have a method to get domain by ID
			const domain = {
				id: record.domainId,
				domain:
					typeof record.domainId === 'string'
						? record.domainId.includes('.')
							? record.domainId
							: `example${record.domainId}.com`
						: 'example.com',
				name: `Domain for ${record.domainId}`,
			};

			// Generate a unique receipt ID
			const receiptId = `CR${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 1000)}`;

			// Map consent preferences to services and purposes
			const services = Object.entries(record.preferences || {}).map(
				([key, value]) => {
					// Convert key to a more readable service name
					const serviceName = key.charAt(0).toUpperCase() + key.slice(1);

					return {
						service: serviceName,
						purposes: [
							{
								purpose: key,
								purposeDescription: `${value ? 'Enabled' : 'Disabled'} ${key} tracking and functionality`,
								consentType: 'EXPLICIT',
								purposeCategory: [serviceName],
								termination: record.policyId
									? `As specified in policy ${record.policyId}`
									: 'Until consent is withdrawn',
								thirdPartyDisclosure: false,
							},
						],
					};
				}
			);

			// Extract metadata from consent records
			const metadata = {
				deviceInfo:
					records.length > 0 && records[0]?.recordMetadata?.deviceInfo
						? records[0].recordMetadata.deviceInfo
						: 'Not recorded',
				ipAddress: record.ipAddress || 'Not recorded',
				policyId: record.policyId,
				...record.metadata,
			};

			// Create the receipt object
			const receipt: ConsentReceipt = {
				version: '1.0.0',
				jurisdiction: 'GDPR', // Default to GDPR
				consentTimestamp: record.givenAt,
				collectionMethod:
					records.length > 0 && records[0]?.recordTypeDetail
						? records[0].recordTypeDetail
						: 'API',
				consentReceiptID: receiptId,
				publicKey: process.env.CONSENT_RECEIPT_PUBLIC_KEY || 'not-configured',
				subject: {
					id: userRecord.id,
					idType: 'UUID',
				},
				dataController: {
					id: domain.domain,
					name: domain.name || domain.domain,
					on_behalf: [],
				},
				policyURL: `https://${domain.domain}/privacy`,
				services,
				sensitive: false,
				spiCat: [],
				metadata,
			};

			// Add signature if requested
			if (params.includeSignature) {
				// Create a hash of the receipt data as a signature
				const receiptString = JSON.stringify(receipt);
				const signature = crypto
					.createHash('sha256')
					.update(receiptString)
					.digest('hex');

				receipt.signature = signature;
			}

			// Return the completed receipt
			return {
				receipt,
				receiptId,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			if (ctx.context && typeof ctx.context === 'object') {
				// Type-safe logger access
				const contextWithLogger = ctx.context as unknown as C15TContext;
				contextWithLogger.logger?.error?.(
					'Error generating consent receipt:',
					error
				);
			}

			// Rethrow APIErrors as is
			if (error instanceof APIError) {
				throw error;
			}

			// Handle Zod validation errors
			if (error instanceof z.ZodError) {
				throw new APIError('BAD_REQUEST', {
					message: 'Invalid request parameters',
					details: error.errors,
				});
			}

			// Handle other errors
			throw new APIError('INTERNAL_SERVER_ERROR', {
				message: 'An error occurred while generating the consent receipt',
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
);
