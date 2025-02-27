export const binary = {
	encode(str: string): string {
		return unescape(encodeURIComponent(str));
	},

	decode(str: string): string {
		return decodeURIComponent(escape(str));
	},
};
