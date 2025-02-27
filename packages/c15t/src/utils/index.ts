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

// Export all utility functions
export * from './binary';
export * from './crypto';
export * from './date';
export * from './encode';
export * from './env';
export * from './id';
export * from './json';
export * from './logger';
export * from './url';
