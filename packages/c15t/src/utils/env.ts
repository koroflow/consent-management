export const env = typeof process !== 'undefined' ? process.env : {};

export const isProduction =
	typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

export const isDevelopment =
	typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
