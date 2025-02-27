/**
 * Date Utilities for c15t
 * 
 * This module provides date-related utility functions for the c15t
 * consent management system, including functions for calculating
 * future dates based on time increments.
 */

/**
 * Calculates a future date by adding time to the current date
 * 
 * This function is commonly used to calculate expiration dates for
 * consent records, cookies, and rate limiting.
 * 
 * @param seconds - The number of seconds or milliseconds to add
 * @param unit - The unit of time ('sec' for seconds, 'ms' for milliseconds)
 * @returns A Date object representing the future date
 * 
 * @example
 * ```typescript
 * // Get a date 1 hour in the future
 * const futureDate = getDate(3600, 'sec');
 * 
 * // Get a date 30 minutes in the future using milliseconds
 * const thirtyMinLater = getDate(30 * 60 * 1000, 'ms');
 * ```
 */
export function getDate(seconds: number, unit: 'sec' | 'ms' = 'ms'): Date {
	const now = new Date();
	const multiplier = unit === 'sec' ? 1000 : 1;
	return new Date(now.getTime() + seconds * multiplier);
}
