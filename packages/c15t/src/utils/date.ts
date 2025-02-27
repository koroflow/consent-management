export function getDate(seconds: number, unit: 'sec' | 'ms' = 'ms'): Date {
	const now = new Date();
	const multiplier = unit === 'sec' ? 1000 : 1;
	return new Date(now.getTime() + seconds * multiplier);
}
