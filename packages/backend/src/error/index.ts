export { BASE_ERROR_CODES } from './codes';
export type { ErrorCategory, ErrorCode, ErrorMessage } from './codes';
export { C15TError } from './error';
export {
	fail,
	failAsync,
	safeResult,
	safeResultAsync,
} from './results';
export {
	recoverFromCodes,
	recoverFromCategory,
} from './recovery';
export {
	logError,
	logErrorAsync,
} from './logging';
export {
	validationPipeline,
	retrievalPipeline,
} from './pipeline';

export { fromPromise, okAsync, ok, Result } from 'neverthrow';
