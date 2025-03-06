import { APIError } from 'better-call';
import type { GenericEndpointContext } from '~/types';
import type { Consent, User } from '~/db/schema';

export interface CreateConsentParams {
	userId?: string;
	externalUserId?: string;
	domain: string;
	preferences: Record<string, boolean>;
	policyVersion?: string;
	metadata?: Record<string, unknown>;
	ipAddress?: string;
	userAgent?: string;
}

export interface ConsentService {
	createConsentWithUser: (
		params: CreateConsentParams,
		context?: GenericEndpointContext
	) => Promise<{
		user: User;
		domain: { id: string };
		consent: Consent;
		record: { id: string };
		purposeIds: string[];
	}>;
}

export function createConsentService(registry: any): ConsentService {
	return {
		async createConsentWithUser(
			{
				userId,
				externalUserId,
				domain,
				preferences,
				policyVersion,
				metadata,
				ipAddress,
				userAgent,
			},
			context
		) {
			let user: User | null = null;

			// If both userId and externalUserId are provided, validate they match
			if (userId && externalUserId) {
				const userById = await registry.findUserById(userId);
				const userByExternalId =
					await registry.findUserByExternalId(externalUserId);

				if (!userById || !userByExternalId) {
					throw new APIError('NOT_FOUND', {
						message: 'One or both users not found',
						status: 404,
					});
				}

				if (userById.id !== userByExternalId.id) {
					throw new APIError('BAD_REQUEST', {
						message:
							'Provided userId and externalUserId do not match the same user',
						status: 400,
					});
				}

				user = userById;
			} else {
				// Try to find user by userId if provided
				if (userId) {
					user = await registry.findUserById(userId);
					if (!user) {
						throw new APIError('NOT_FOUND', {
							message: 'User not found',
							status: 404,
						});
					}
				}

				// If no user found and externalUserId provided, try that
				if (!user && externalUserId) {
					user = await registry.findUserByExternalId(externalUserId);
					if (!user) {
						throw new APIError('NOT_FOUND', {
							message: 'User not found with provided external ID',
							status: 404,
						});
					}
				}

				// If still no user found and no externalUserId provided, create a new one
				if (!user && !externalUserId) {
					user = await registry.createUser({
						identityProvider: 'anonymous',
						lastIpAddress: ipAddress || 'unknown',
						isIdentified: false,
						createdAt: new Date(),
					});

					if (!user) {
						throw new APIError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create user',
							status: 503,
						});
					}
				}
			}

			if (!user) {
				throw new APIError('BAD_REQUEST', { message: 'User ID is required' });
			}

			// Check if domain exists, create if it doesn't
			let domainRecord = await registry.findDomainByName(domain);
			if (!domainRecord) {
				domainRecord = await registry.createDomain({
					name: domain,
					description: `Auto-created domain for ${domain}`,
					isActive: true,
					isVerified: true,
					allowedOrigins: [],
				});

				if (!domainRecord) {
					throw new APIError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create domain',
						status: 503,
					});
				}
			}

			const now = new Date();

			// Ensure all purposes exist in database
			const purposeIds = await Promise.all(
				Object.entries(preferences)
					.filter(([_, isConsented]) => isConsented)
					.map(async ([purposeCode]) => {
						let existingPurpose = await registry.findPurposeByCode(purposeCode);

						if (!existingPurpose) {
							existingPurpose = await registry.createPurpose({
								code: purposeCode,
								name: purposeCode,
								description: `Auto-created purpose for ${purposeCode}`,
								isActive: true,
								isEssential: false,
								dataCategory: 'functional',
								legalBasis: 'consent',
								createdAt: now,
								updatedAt: now,
							});
						}

						return existingPurpose.id;
					})
			);

			// Create consent record
			const consentRecord = await registry.createConsent({
				userId: user.id,
				domainId: domainRecord.id,
				purposeIds,
				status: 'active',
				givenAt: now,
				isActive: true,
				ipAddress: ipAddress || 'unknown',
				userAgent: userAgent || 'unknown',
				metadata: metadata || {},
				updatedAt: now,
				history: [
					{
						actionType: 'given',
						timestamp: now,
						details: {
							ipAddress: ipAddress || 'unknown',
							userAgent: userAgent || 'unknown',
							policyVersion,
							...metadata,
						},
					},
				],
			});

			// Create record entry
			const record = await registry.createRecord({
				userId: user.id,
				consentId: consentRecord.id,
				actionType: 'given',
				details: {
					ipAddress: ipAddress || 'unknown',
					userAgent: userAgent || 'unknown',
					policyVersion,
					...metadata,
				},
				createdAt: now,
				updatedAt: now,
			});

			return {
				user,
				domain: domainRecord,
				consent: consentRecord,
				record,
				purposeIds,
			};
		},
	};
}
