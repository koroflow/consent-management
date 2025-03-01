/**
 * Database Hooks Module
 *
 * This module provides functionality for executing hooks before and after
 * database operations. It allows for data transformation, validation,
 * and side effects during CRUD operations.
 *
 * @module db/hooks
 */

export { getWithHooks } from './with-hooks-factory';
export type {
	HookableModels,
	HookContext,
	CustomOperationFunction,
	HookResult,
} from './types';
