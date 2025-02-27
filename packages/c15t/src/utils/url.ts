import { env } from './env';

export function getBaseURL(
	baseURL?: string,
	basePath?: string
): string | undefined {
	if (baseURL) {
		const url = new URL(basePath || '/api/consent', baseURL);
		return url.toString();
	}

	// Try to get from environment variables
	const envBaseURL =
		env.C15T_URL ||
		env.CONSENT_URL ||
		env.NEXT_PUBLIC_C15T_URL ||
		env.NEXT_PUBLIC_CONSENT_URL;

	if (envBaseURL) {
		const url = new URL(basePath || '/api/consent', envBaseURL);
		return url.toString();
	}

	return undefined;
}
