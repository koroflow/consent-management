export function safeJSONParse<T>(
	value: string,
	defaultValue: T | null = null
): T | null {
	try {
		return JSON.parse(value) as T;
	} catch (error) {
		return defaultValue;
	}
}
