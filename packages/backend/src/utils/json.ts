import type { SuperJSONValue } from 'node_modules/superjson/dist/types';
import superjson from 'superjson';
/**
 * Parse a JSON string using SuperJSON
 * @param json - The JSON string to parse
 * @returns The parsed JSON value
 */
export function parseJson(json: SuperJSONValue) {
	return superjson.parse(json);
}

/**
 * Stringify a value using SuperJSON
 * @param value - The value to stringify
 * @returns The stringified value
 */
export function stringifyJson(value: SuperJSONValue) {
	return superjson.stringify(value);
}
