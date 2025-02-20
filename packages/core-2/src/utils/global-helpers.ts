// global-helpers.ts

// Safely access window and other browser globals
const win: (Window & typeof globalThis) | undefined =
	typeof window !== 'undefined' ? window : undefined;

export const global: typeof globalThis | undefined =
	typeof globalThis !== 'undefined' ? globalThis : win;

export const localStorage = global?.localStorage;
export const sessionStorage = global?.sessionStorage;
export const document = global?.document;
export const navigator = global?.navigator;
export const location = global?.location;
export const fetch = global?.fetch;
export const XMLHttpRequest =
	global?.XMLHttpRequest && 'withCredentials' in new global.XMLHttpRequest()
		? global.XMLHttpRequest
		: undefined;
export const AbortController = global?.AbortController;

// Export window separately if needed
export { win as window };
