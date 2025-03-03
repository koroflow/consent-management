/**
 * c15t Utility Functions
 *
 * This module serves as the main entry point for all utility functions used in the c15t
 * consent management system. It re-exports utilities from specialized modules for easier access.
 *
 * Import utilities from this module for a cleaner import structure:
 * @example
 * ```typescript
 * import { generateId, encrypt, formatDate } from '../utils';
 * ```
 */
export * from './env';
export * from './hide-metadata';
export * from './logger';
export * from './url';
export * from './json';
