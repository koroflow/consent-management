import { createAuthEndpoint } from '../call';
import { C15TError, BASE_ERROR_CODES } from '~/error';
import { z } from 'zod';
import type { C15TContext } from '../../types';
import type { EntityOutputFields } from '~/db/schema/definition';

// Define schemas for the different identification methods
const getByUserIdSchema = z.object({
	userId: z.string(),
	domain: z.string().optional(),
	identifierType: z.literal('userId'),
});

const getByExternalIdSchema = z.object({
	externalId: z.string(),
	domain: z.string().optional(),
	identifierType: z.literal('externalId'),
});

const getByIpAddressSchema = z.object({
	ipAddress: z.string(),
	domain: z.string(),
	identifierType: z.literal('ipAddress'),
});

// Combined schema using discriminated union
const getConsentSchema = z.discriminatedUnion('identifierType', [
	getByUserIdSchema,
	getByExternalIdSchema,
	getByIpAddressSchema,
]);

export interface GetConsentResponse {
	success: boolean;
	data: {
		hasActiveConsent: boolean;
		records: Array<{
			id: string;
			userId: string;
			domain: string;
			status: string;
			givenAt: string;
			policyId: string;
			preferences: Record<string, string | null>;
		}>;
		identifiedBy: string | null;
	};
}

/**
 * Endpoint for retrieving active consent records.
 *
 * This endpoint allows clients to retrieve a user's active consent records by specifying:
 * 1. The user ID (internal UUID) and an optional domain
 * 2. The external ID and an optional domain
 * 3. The IP address and a required domain (since IP alone is too broad)
 *
 * @endpoint GET /consent/get
 */
export const getConsent = createAuthEndpoint(
	'/consent/get',
	{
		method: 'GET',
		query: getConsentSchema,
	},
	async (ctx) => {
		try {
			const validatedData = getConsentSchema.safeParse(ctx.query);

			if (!validatedData.success) {
				throw new C15TError(
					'The request data is invalid. Please ensure all required fields are correctly filled and formatted.',
					{
						code: BASE_ERROR_CODES.BAD_REQUEST,
						status: 400,
						data: {
							details: validatedData.error.errors,
						},
					}
				);
			}

			const params = validatedData.data;
			const { registry } = ctx.context as C15TContext;

			if (!registry) {
				throw new C15TError(
					'The registry service is currently unavailable. Please check the service status and try again later.',
					{
						code: BASE_ERROR_CODES.INITIALIZATION_FAILED,
						status: 503,
					}
				);
			}

			// Find user based on identifier type
			let users: EntityOutputFields<'user'>[] = [];

			// biome-ignore lint/style/useDefaultSwitchClause: <explanation>
			switch (params.identifierType) {
				case 'userId': {
					const userRecord = await registry.findUserById(params.userId);
					if (userRecord) {
						users = [userRecord];
					}
					break;
				}
				case 'externalId': {
					const externalUser = await registry.findUserByExternalId(
						params.externalId
					);
					if (externalUser) {
						users = [externalUser];
					}
					break;
				}
				case 'ipAddress': {
					// For IP address lookups, we require a domain
					if (!params.domain) {
						throw new C15TError(
							'A domain must be specified when using an IP address for identification. Please include a valid domain in your request.',
							{
								code: BASE_ERROR_CODES.MISSING_REQUIRED_PARAMETER,
								status: 400,
								data: {
									ipAddress: params.ipAddress,
								},
							}
						);
					}

					// This is a simplification - in a real implementation, we would need
					// a method to look up users by IP address, possibly by scanning recent consent records
					// For now, we'll use an empty array as this would require a custom query
					users = [];
					break;
				}
			}

			if (users.length === 0) {
				return {
					success: true,
					data: {
						hasActiveConsent: false,
						records: [],
						identifiedBy: params.identifierType,
					},
				};
			}

			// Get active consent records for these users
			const consentResults: Array<{
				id: string;
				userId: string;
				domain: string;
				status: string;
				givenAt: string;
			}> = [];

			for (const user of users) {
				// Use the adapter to find user consents
				const userConsents = await registry.findConsents({
					userId: user.id,
					domainId: params.domain,
				});

				// Filter for active consents only
				const activeConsents = userConsents.filter(
					(consent) => consent.status === 'active'
				);

				// Include user identification in the results
				for (const consent of activeConsents) {
					consentResults.push({
						id: consent.id,
						userId: user.id,
						// domain: consent.domainId,
						// status: consent.status,
						givenAt: consent.givenAt.toISOString(),
						// policyId: consent.policyId || '',
						//@ts-expect-error
						preferences: consent.preferences || {},
					});
				}
			}

			return {
				success: true,
				data: {
					hasActiveConsent: consentResults.length > 0,
					records: consentResults,
					identifiedBy: params.identifierType,
				},
			};
		} catch (error) {
			const context = ctx.context as C15TContext;
			context.logger?.error?.('Error getting consent:', error);

			if (error instanceof C15TError) {
				throw error;
			}
			if (error instanceof z.ZodError) {
				throw new C15TError(
					'The request data is invalid. Please ensure all required fields are correctly filled and formatted.',
					{
						code: BASE_ERROR_CODES.BAD_REQUEST,
						status: 400,
						data: {
							details: error.errors,
						},
					}
				);
			}

			throw new C15TError(
				'Failed to retrieve consent information. Please try again later or contact support if the issue persists.',
				{
					code: BASE_ERROR_CODES.FAILED_TO_GET_CONSENT,
					status: 503,
					data: {
						details:
							error instanceof Error ? { message: error.message } : { error },
					},
				}
			);
		}
	}
);
