export const utils = `
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function setupDarkMode() {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
		document.documentElement.classList.toggle('dark', e.matches);
		document.documentElement.classList.toggle('light', !e.matches);
	};

	handleChange(mediaQuery);
	mediaQuery.addEventListener('change', handleChange);
	return () => mediaQuery.removeEventListener('change', handleChange);
}

export function clearLocalStorage() {
	if (typeof window !== 'undefined') {
		try {
			localStorage.clear();
		} catch (error) {
			console.warn('Error during cleanup:', error);
		}
	}
}
`;
