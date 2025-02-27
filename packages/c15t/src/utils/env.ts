/**
 * Environment Utilities for c15t
 * 
 * This module provides environment-related utility functions and variables,
 * including environment detection helpers that work in both browser and Node.js environments.
 */

/**
 * Environment variables object
 * 
 * Provides access to environment variables in a way that works in both
 * browser and Node.js environments. In Node.js, this will be process.env,
 * and in browsers, it will be an empty object.
 */
export const env = typeof process !== 'undefined' ? process.env : {};

/**
 * Determines if the application is running in production mode
 * 
 * Checks if NODE_ENV is set to 'production'. This is useful for
 * conditionally enabling or disabling features based on the environment.
 */
export const isProduction =
	typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

/**
 * Determines if the application is running in development mode
 * 
 * Checks if NODE_ENV is set to 'development'. This is useful for
 * conditionally enabling debugging features in development environments.
 */
export const isDevelopment =
	typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
