import { parseConsentOutput, parseUserOutput } from './schema';
import type {
	User,
	Consent,
	ConsentPurpose,
	ConsentRecord,
	ConsentAuditLog,
} from '~/types';
import { getWithHooks } from './with-hooks';
import type {
	Adapter,
	C15TContext,
	C15TOptions,
	GenericEndpointContext,
	Where,
} from '~/types';

export const createInternalAdapter = (
	adapter: Adapter,
	ctx: {
		options: C15TOptions;
		hooks: Exclude<C15TOptions['databaseHooks'], undefined>[];
		generateId: C15TContext['generateId'];
	}
) => {
	const options = ctx.options;
	const secondaryStorage = options.secondaryStorage;
	const consentExpiration = options.consent?.expiresIn || 31536000; // 1 year default
	const { createWithHooks, updateWithHooks } = getWithHooks(adapter, ctx);

	return {
		createUser: async (
			user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & Partial<User>,
			context?: GenericEndpointContext
		) => {
			const createdUser = await createWithHooks(
				{
					createdAt: new Date(),
					updatedAt: new Date(),
					...user,
				},
				'user',
				undefined,
				context
			);
			return createdUser as User;
		},
		findUserById: async (userId: string) => {
			const user = await adapter.findOne<User>({
				model: 'user',
				where: [
					{
						field: 'id',
						value: userId,
					},
				],
			});
			return user ? parseUserOutput(ctx.options, user) : null;
		},
		findUserByExternalId: async (externalId: string) => {
			const user = await adapter.findOne<User>({
				model: 'user',
				where: [
					{
						field: 'externalId',
						value: externalId,
					},
				],
			});
			return user ? parseUserOutput(ctx.options, user) : null;
		},
		updateUser: async (
			userId: string,
			data: Partial<User> & Record<string, unknown>,
			context?: GenericEndpointContext
		) => {
			const user = await updateWithHooks<User>(
				data,
				[
					{
						field: 'id',
						value: userId,
					},
				],
				'user',
				undefined,
				context
			);
			return user ? parseUserOutput(ctx.options, user) : null;
		},
		deleteUser: async (userId: string) => {
			// Delete all consents associated with the user
			await adapter.deleteMany({
				model: 'consent',
				where: [
					{
						field: 'userId',
						value: userId,
					},
				],
			});

			// Delete the user
			await adapter.delete({
				model: 'user',
				where: [
					{
						field: 'id',
						value: userId,
					},
				],
			});
		},
		createConsent: async (
			consent: Omit<Consent, 'id' | 'givenAt'> & Partial<Consent>,
			context?: GenericEndpointContext
		) => {
			const now = new Date();
			const validUntil = new Date(now.getTime() + consentExpiration * 1000);

			const createdConsent = await createWithHooks(
				{
					givenAt: now,
					validUntil,
					createdAt: now,
					updatedAt: now,
					...consent,
				},
				'user',
				secondaryStorage
					? {
							fn: async (consentData) => {
								// Store a summary of consent in secondary storage if enabled
								if (options.consent?.cookieStorage?.enabled) {
									const consentKey = `consent-${consent.userId}-${consent.domainId || 'global'}`;
									const ttl = options.consent.cookieStorage.maxAge || 600; // 10 minutes default
									await secondaryStorage.set(
										consentKey,
										JSON.stringify({
											id: consentData.id,
											userId: consentData.userId,
											preferences: consentData.preferences,
											givenAt: consentData.givenAt.toISOString(),
											validUntil: consentData.validUntil.toISOString(),
										}),
										ttl
									);
								}
								return consentData;
							},
							executeMainFn: true, // Always store consent in database
						}
					: undefined,
				context
			);

			return parseConsentOutput(ctx.options, createdConsent);
		},
		findConsent: async (consentId: string) => {
			const consent = await adapter.findOne<Consent>({
				model: 'consent',
				where: [
					{
						field: 'id',
						value: consentId,
					},
				],
			});

			if (!consent) {
				return null;
			}

			const user = await adapter.findOne<User>({
				model: 'user',
				where: [
					{
						field: 'id',
						value: consent.userId,
					},
				],
			});

			return {
				consent: parseConsentOutput(ctx.options, consent),
				user: user ? parseUserOutput(ctx.options, user) : null,
			};
		},
		findUserConsents: async (userId: string, domainId?: string) => {
			const whereConditions: Where[] = [
				{
					field: 'userId',
					value: userId,
				},
				{
					field: 'isActive',
					value: true,
				},
			];

			if (domainId) {
				whereConditions.push({
					field: 'domainId',
					value: domainId,
				});
			}

			const consents = await adapter.findMany<Consent>({
				model: 'consent',
				where: whereConditions,
				sortBy: {
					field: 'givenAt',
					direction: 'desc',
				},
			});

			return consents.map((consent) =>
				parseConsentOutput(ctx.options, consent)
			);
		},
		updateConsent: async (
			consentId: string,
			data: Partial<Consent> & Record<string, unknown>,
			context?: GenericEndpointContext
		) => {
			const updatedConsent = await updateWithHooks<Consent>(
				{
					...data,
					updatedAt: new Date(),
				},
				[{ field: 'id', value: consentId }],
				'user',
				secondaryStorage && options.consent?.cookieStorage?.enabled
					? {
							async fn(data) {
								const consent = await adapter.findOne<Consent>({
									model: 'consent',
									where: [{ field: 'id', value: consentId }],
								});

								if (consent) {
									const consentKey = `consent-${consent.userId}-${consent.domainId || 'global'}`;
									//@ts-expect-error
									const ttl = options.consent.cookieStorage.maxAge || 600;
									const updatedConsent = {
										...consent,
										...data,
									};

									await secondaryStorage.set(
										consentKey,
										JSON.stringify({
											id: updatedConsent.id,
											userId: updatedConsent.userId,
											preferences: updatedConsent.preferences,
											givenAt:
												updatedConsent.givenAt instanceof Date
													? updatedConsent.givenAt.toISOString()
													: updatedConsent.givenAt,
											validUntil:
												updatedConsent.validUntil instanceof Date
													? updatedConsent.validUntil.toISOString()
													: updatedConsent.validUntil,
										}),
										ttl
									);

									return updatedConsent;
								}

								return null;
							},
							executeMainFn: true,
						}
					: undefined,
				context
			);

			return updatedConsent
				? parseConsentOutput(ctx.options, updatedConsent)
				: null;
		},
		revokeConsent: async ({
			consentId,
			reason,
			actor,
			metadata,
			context,
		}: {
			consentId: string;
			reason: string;
			actor: string;
			metadata?: Record<string, unknown>;
			context?: GenericEndpointContext;
		}) => {
			// Mark consent as inactive
			const updatedConsent = await updateWithHooks<Consent>(
				{
					isActive: false,
					updatedAt: new Date(),
				},
				[{ field: 'id', value: consentId }],
				'user',
				undefined,
				context
			);

			if (!updatedConsent) {
				return null;
			}

			// Create withdrawal record
			const withdrawal = await createWithHooks(
				{
					consentId,
					revokedAt: new Date(),
					revocationReason: reason,
					method: 'api',
					actor,
					metadata: metadata ? JSON.stringify(metadata) : null,
					createdAt: new Date(),
				},
				'user',
				undefined,
				context
			);

			// Clear from secondary storage if enabled
			if (secondaryStorage && options.consent?.cookieStorage?.enabled) {
				const consentKey = `consent-${updatedConsent.userId}-${updatedConsent.domainId || 'global'}`;
				await secondaryStorage.delete(consentKey);
			}

			return {
				consent: parseConsentOutput(ctx.options, updatedConsent),
				withdrawal,
			};
		},
		createConsentRecord: async (
			record: Omit<ConsentRecord, 'id' | 'createdAt'> & Partial<ConsentRecord>,
			context?: GenericEndpointContext
		) => {
			const createdRecord = await createWithHooks(
				{
					createdAt: new Date(),
					...record,
				},
				'user',
				undefined,
				context
			);

			return createdRecord as ConsentRecord;
		},
		createConsentPurpose: async (
			purpose: Omit<ConsentPurpose, 'id' | 'createdAt' | 'updatedAt'> &
				Partial<ConsentPurpose>,
			context?: GenericEndpointContext
		) => {
			const createdPurpose = await createWithHooks(
				{
					createdAt: new Date(),
					updatedAt: new Date(),
					// isActive: true,
					...purpose,
				},
				'user',
				undefined,
				context
			);

			return createdPurpose as ConsentPurpose;
		},
		findConsentPurposes: async (includeInactive?: boolean) => {
			const whereConditions: Where[] = [];

			if (!includeInactive) {
				whereConditions.push({
					field: 'isActive',
					value: true,
				});
			}

			const purposes = await adapter.findMany<ConsentPurpose>({
				model: 'consentPurpose',
				where: whereConditions,
				sortBy: {
					field: 'createdAt',
					direction: 'asc',
				},
			});

			return purposes;
		},
		createConsentAuditLog: async (
			log: Omit<ConsentAuditLog, 'id' | 'timestamp' | 'createdAt'> &
				Partial<ConsentAuditLog>,
			context?: GenericEndpointContext
		) => {
			const now = new Date();
			const createdLog = await createWithHooks(
				{
					timestamp: now,
					createdAt: now,
					...log,
				},
				'user',
				undefined,
				context
			);

			return createdLog as ConsentAuditLog;
		},
		findConsentAuditLogs: async (
			filter: {
				userId?: string;
				resourceType?: string;
				resourceId?: string;
				action?: string;
				from?: Date;
				to?: Date;
			},
			limit?: number,
			offset?: number
		) => {
			const whereConditions: Where[] = [];

			if (filter.userId) {
				whereConditions.push({
					field: 'userId',
					value: filter.userId,
				});
			}

			if (filter.resourceType) {
				whereConditions.push({
					field: 'resourceType',
					value: filter.resourceType,
				});
			}

			if (filter.resourceId) {
				whereConditions.push({
					field: 'resourceId',
					value: filter.resourceId,
				});
			}

			if (filter.action) {
				whereConditions.push({
					field: 'action',
					value: filter.action,
				});
			}

			if (filter.from) {
				whereConditions.push({
					field: 'timestamp',
					operator: 'gte',
					value: filter.from,
				});
			}

			if (filter.to) {
				whereConditions.push({
					field: 'timestamp',
					operator: 'lte',
					value: filter.to,
				});
			}

			const logs = await adapter.findMany<ConsentAuditLog>({
				model: 'consentAuditLog',
				where: whereConditions,
				sortBy: {
					field: 'timestamp',
					direction: 'desc',
				},
				limit,
				offset,
			});

			return logs;
		},
		countConsentAuditLogs: async (filter: {
			userId?: string;
			resourceType?: string;
			resourceId?: string;
			action?: string;
			from?: Date;
			to?: Date;
		}) => {
			const whereConditions: Where[] = [];

			if (filter.userId) {
				whereConditions.push({
					field: 'userId',
					value: filter.userId,
				});
			}

			if (filter.resourceType) {
				whereConditions.push({
					field: 'resourceType',
					value: filter.resourceType,
				});
			}

			if (filter.resourceId) {
				whereConditions.push({
					field: 'resourceId',
					value: filter.resourceId,
				});
			}

			if (filter.action) {
				whereConditions.push({
					field: 'action',
					value: filter.action,
				});
			}

			if (filter.from) {
				whereConditions.push({
					field: 'timestamp',
					operator: 'gte',
					value: filter.from,
				});
			}

			if (filter.to) {
				whereConditions.push({
					field: 'timestamp',
					operator: 'lte',
					value: filter.to,
				});
			}

			const total = await adapter.count({
				model: 'consentAuditLog',
				where: whereConditions,
			});

			return total;
		},
	};
};

export type InternalAdapter = ReturnType<typeof createInternalAdapter>;
