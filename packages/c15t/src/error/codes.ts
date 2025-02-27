// error/codes.ts
export const BASE_ERROR_CODES = {
	CONSENT_NOT_FOUND: 'Consent not found',
	CONSENT_EXPIRED: 'Consent has expired',
	FAILED_TO_CREATE_CONSENT: 'Failed to create consent',
	FAILED_TO_UPDATE_CONSENT: 'Failed to update consent',
	FAILED_TO_GET_CONSENT: 'Failed to get consent',
	FAILED_TO_LIST_PURPOSES: 'Failed to list purposes',
	FAILED_TO_CREATE_PURPOSE: 'Failed to create purpose',
	FAILED_TO_UPDATE_PURPOSE: 'Failed to update purpose',
	FAILED_TO_DELETE_PURPOSE: 'Failed to delete purpose',
	INVALID_PURPOSE_ID: 'Invalid purpose ID',
	PURPOSE_NOT_FOUND: 'Purpose not found',
	REQUIRED_PURPOSE_REJECTION: 'Cannot reject a required purpose',
	FAILED_TO_GET_CONSENT_HISTORY: 'Failed to get consent history',
	INVALID_TOKEN: 'Invalid token',
	INVALID_CONFIGURATION: 'Invalid configuration',
	MISSING_REQUIRED_PARAMETER: 'Missing required parameter',
	INVALID_REQUEST: 'Invalid request',
	UNAUTHORIZED: 'Unauthorized',
	FORBIDDEN: 'Forbidden',
	INTERNAL_SERVER_ERROR: 'Internal server error',
};

export class C15tError extends Error {
	constructor(
		message: string,
		public status: number = 500,
		public code: string = 'INTERNAL_SERVER_ERROR'
	) {
		super(message);
		this.name = 'C15tError';
	}
}
