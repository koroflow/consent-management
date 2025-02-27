export function generateId(length = 21): string {
	if (
		typeof crypto !== 'undefined' &&
		typeof crypto.getRandomValues === 'function'
	) {
		const charset =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		const array = new Uint8Array(length);
		crypto.getRandomValues(array);

		let result = '';
		for (let i = 0; i < length; i++) {
			// TypeScript needs assurance the index access is valid
			// Uint8Array will always have values after getRandomValues
			const value = array[i] || 0; // Fallback to 0 if somehow undefined
			result += charset.charAt(value % charset.length);
		}

		return result;
	}

	// Fallback for environments without crypto
	const charset =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		result += charset.charAt(Math.floor(Math.random() * charset.length));
	}

	return result;
}
