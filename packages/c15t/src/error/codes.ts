/**
 * Standardized error codes for the c15t consent management system.
 *
 * These error codes are used throughout the application to provide consistent
 * error messages and enable proper error handling in client applications.
 * Each error code represents a specific type of error that can occur during
 * consent management operations.
 *
 * @example
 * ```typescript
 * import { BASE_ERROR_CODES, c15tError } from '@c15t/error';
 *
 * // Handle a specific error
 * try {
 *   await consentManager.updateConsent(consentId, preferences);
 * } catch (error) {
 *   if (error instanceof c15tError && error.code === BASE_ERROR_CODES.CONSENT_NOT_FOUND) {
 *     // Handle the specific case where consent is not found
 *     console.error('Cannot update: consent record does not exist');
 *   } else {
 *     // Handle other errors
 *     console.error('Failed to update consent:', error.message);
 *   }
 * }
 * ```
 */
export const BASE_ERROR_CODES = {
	/**
	 * The requested consent record could not be found.
	 * This may occur when attempting to retrieve, update, or delete a non-existent consent record.
	 */
	CONSENT_NOT_FOUND: 'Consent not found',

	/**
	 * The consent record has expired and is no longer valid.
	 * This may occur when attempting to use a consent record after its expiration date.
	 */
	CONSENT_EXPIRED: 'Consent has expired',

	/**
	 * An error occurred while attempting to create a new consent record.
	 * This may be due to validation errors, storage issues, or other internal errors.
	 */
	FAILED_TO_CREATE_CONSENT: 'Failed to create consent',

	/**
	 * An error occurred while attempting to update an existing consent record.
	 * This may be due to validation errors, storage issues, or concurrent modifications.
	 */
	FAILED_TO_UPDATE_CONSENT: 'Failed to update consent',

	/**
	 * An error occurred while attempting to retrieve a consent record.
	 * This may be due to storage issues, permissions, or other internal errors.
	 */
	FAILED_TO_GET_CONSENT: 'Failed to get consent',

	/**
	 * An error occurred while attempting to list available consent purposes.
	 * This may be due to storage issues, permissions, or other internal errors.
	 */
	FAILED_TO_LIST_PURPOSES: 'Failed to list purposes',

	/**
	 * An error occurred while attempting to create a new consent purpose.
	 * This may be due to validation errors, duplicate purpose IDs, or other internal errors.
	 */
	FAILED_TO_CREATE_PURPOSE: 'Failed to create purpose',

	/**
	 * An error occurred while attempting to update an existing consent purpose.
	 * This may be due to validation errors or other internal errors.
	 */
	FAILED_TO_UPDATE_PURPOSE: 'Failed to update purpose',

	/**
	 * An error occurred while attempting to delete a consent purpose.
	 * This may be due to dependencies, permissions, or other constraints.
	 */
	FAILED_TO_DELETE_PURPOSE: 'Failed to delete purpose',

	/**
	 * The provided purpose ID is invalid or does not conform to the expected format.
	 * This may occur when creating or updating purposes with malformed IDs.
	 */
	INVALID_PURPOSE_ID: 'Invalid purpose ID',

	/**
	 * The requested consent purpose could not be found.
	 * This may occur when attempting to retrieve, update, or delete a non-existent purpose.
	 */
	PURPOSE_NOT_FOUND: 'Purpose not found',

	/**
	 * An attempt was made to reject a required consent purpose.
	 * Required purposes cannot be rejected as they are mandatory for system operation.
	 */
	REQUIRED_PURPOSE_REJECTION: 'Cannot reject a required purpose',

	/**
	 * An error occurred while attempting to retrieve the consent history.
	 * This may be due to storage issues, permissions, or other internal errors.
	 */
	FAILED_TO_GET_CONSENT_HISTORY: 'Failed to get consent history',

	/**
	 * The provided token is invalid, expired, or malformed.
	 * This may occur when using incorrect or outdated consent tokens.
	 */
	INVALID_TOKEN: 'Invalid token',

	/**
	 * The provided configuration is invalid or contains errors.
	 * This may occur when initializing the system with incorrect settings.
	 */
	INVALID_CONFIGURATION: 'Invalid configuration',

	/**
	 * A required parameter is missing from the request.
	 * This may occur when API calls are made without all necessary data.
	 */
	MISSING_REQUIRED_PARAMETER: 'Missing required parameter',

	/**
	 * The request is invalid or malformed.
	 * This is a general error for requests that do not meet the expected format.
	 */
	INVALID_REQUEST: 'Invalid request',

	/**
	 * The request requires authentication that was not provided or is invalid.
	 * This may occur when attempting to access protected resources without proper credentials.
	 */
	UNAUTHORIZED: 'Unauthorized',

	/**
	 * The requester does not have permission to perform the requested operation.
	 * This may occur when authenticated users attempt operations beyond their permission level.
	 */
	FORBIDDEN: 'Forbidden',

	/**
	 * An unexpected internal error occurred on the server.
	 * This is a general error for unexpected exceptions during request processing.
	 */
	INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

/**
 * Type containing all possible error codes from the BASE_ERROR_CODES object
 */
export type ErrorCode = keyof typeof BASE_ERROR_CODES;

/**
 * Type for the error message values in BASE_ERROR_CODES
 */
export type ErrorMessage = (typeof BASE_ERROR_CODES)[ErrorCode];

/**
 * Custom error class for c15t consent management errors.
 *
 * This class extends the standard Error object with additional properties
 * specific to the c15t consent management system, such as error codes,
 * status codes, and contextual data.
 *
 * @example
 * ```typescript
 * // Create and throw a c15t error
 * throw new c15tError('Failed to update user preferences', {
 *   code: BASE_ERROR_CODES.FAILED_TO_UPDATE_CONSENT,
 *   status: 400,
 *   data: { userId: 'user123', preferences: { analytics: true } }
 * });
 *
 * // Create an error from an HTTP response
 * const error = c15tError.fromResponse(response, await response.json());
 * ```
 */
export class c15tError extends Error {
	/**
	 * The error code identifying the type of error
	 */
	code?: ErrorMessage;

	/**
	 * HTTP status code associated with this error
	 */
	status?: number;

	/**
	 * Additional data providing context about the error
	 */
	data?: Record<string, unknown>;

	/**
	 * Creates a new c15tError instance.
	 *
	 * @param message - Human-readable error message
	 * @param options - Additional error options including code, status, and data
	 */
	constructor(
		message: string,
		options?: {
			/**
			 * The error code identifying the type of error
			 */
			code?: ErrorMessage;

			/**
			 * HTTP status code associated with this error
			 */
			status?: number;

			/**
			 * Additional data providing context about the error
			 */
			data?: Record<string, unknown>;
		}
	) {
		super(message);
		this.name = 'c15tError';

		if (options) {
			this.code = options.code;
			this.status = options.status;
			this.data = options.data;
		}

		// Ensure prototype chain works correctly
		Object.setPrototypeOf(this, c15tError.prototype);
	}

	/**
	 * Creates a c15tError from an HTTP response and optional response data.
	 *
	 * @param response - The HTTP Response object
	 * @param data - Optional parsed response data
	 * @returns A new c15tError instance with appropriate properties
	 */
	static fromResponse(response: Response, data?: unknown): c15tError {
		// Extract error message from response or data
		let message = `HTTP error ${response.status}`;
		let code: ErrorMessage | undefined;
		let errorData: Record<string, unknown> | undefined;

		// Try to extract more specific error details from the response data
		if (data && typeof data === 'object' && data !== null) {
			const errorObj = data as Record<string, unknown>;

			if (typeof errorObj.message === 'string') {
				message = errorObj.message;
			}

			if (typeof errorObj.code === 'string') {
				// Check if the code matches one of our known error codes
				const isKnownCode = Object.values(BASE_ERROR_CODES).includes(
					errorObj.code as ErrorMessage
				);
				if (isKnownCode) {
					code = errorObj.code as ErrorMessage;
				}
			}

			// Include any additional error data
			if (typeof errorObj.data === 'object' && errorObj.data !== null) {
				errorData = errorObj.data as Record<string, unknown>;
			}
		}

		return new c15tError(message, {
			code,
			status: response.status,
			data: errorData,
		});
	}

	/**
	 * Determines if an unknown error is a c15tError.
	 *
	 * @param error - The error to check
	 * @returns True if the error is a c15tError instance
	 */
	static isc15tError(error: unknown): error is c15tError {
		return error instanceof c15tError;
	}
}
