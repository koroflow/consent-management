export const base64 = {
	encode(str: string): string {
		if (typeof btoa === 'function') {
			return btoa(str);
		} else if (typeof Buffer !== 'undefined') {
			return Buffer.from(str).toString('base64');
		}
		throw new Error('No base64 encoding function available');
	},

	decode(str: string): string {
		if (typeof atob === 'function') {
			return atob(str);
		} else if (typeof Buffer !== 'undefined') {
			return Buffer.from(str, 'base64').toString();
		}
		throw new Error('No base64 decoding function available');
	},
};
