import { z } from 'zod';

/**
 * Base response interface for all consent-related endpoints
 * @typeParam DataType - The type of data contained in the response
 */
export interface ConsentResponse<DataType> {
	success: boolean;
	data: DataType;
	timestamp: string;
}

/**
 * Common identifier types used across consent endpoints
 */
export const IdentifierType = {
	UserId: 'userId',
	ExternalId: 'externalId',
	IpAddress: 'ipAddress',
} as const;

export type IdentifierType =
	(typeof IdentifierType)[keyof typeof IdentifierType];

/**
 * Base schema for domain-specific operations
 */
export const DomainSchema = z.object({
	domain: z.string().min(1),
});

/**
 * Base schema for user identification
 */
export const UserIdentifierSchema = z.discriminatedUnion('identifierType', [
	z.object({
		identifierType: z.literal(IdentifierType.UserId),
		userId: z.string().uuid(),
	}),
	z.object({
		identifierType: z.literal(IdentifierType.ExternalId),
		externalId: z.string().min(1),
	}),
	z.object({
		identifierType: z.literal(IdentifierType.IpAddress),
		ipAddress: z.string().ip(),
	}),
]);

export type UserIdentifier = z.infer<typeof UserIdentifierSchema>;

/**
 * Error codes specific to consent operations
 */
export const ConsentErrorCode = {
	INVALID_IDENTIFIER: 'INVALID_IDENTIFIER',
	CONSENT_NOT_FOUND: 'CONSENT_NOT_FOUND',
	INVALID_DOMAIN: 'INVALID_DOMAIN',
	UNAUTHORIZED: 'UNAUTHORIZED',
	VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ConsentErrorCode =
	(typeof ConsentErrorCode)[keyof typeof ConsentErrorCode];

/**
 * Base error response for consent-related errors
 */
export interface ConsentError {
	code: ConsentErrorCode;
	message: string;
	details?: Record<string, unknown>;
}
