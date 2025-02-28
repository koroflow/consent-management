/**
 * c15t Consent Management System
 * 
 * This is the main entry point for the c15t library, exporting all public APIs, 
 * components, and types needed to implement consent management in your application.
 */

//------------------------------------------------------------------------------
// Core API
//------------------------------------------------------------------------------

/**
 * Core factory function and types for creating c15t instances
 */
export * from './core';

/**
 * Error codes used throughout the system for consistent error handling
 */
export * from './error/codes';

//------------------------------------------------------------------------------
// Utilities and Helpers
//------------------------------------------------------------------------------

/**
 * Cookie management utilities for handling consent cookies
 */
export * from './cookies';

/**
 * General utility functions used throughout the library
 */
export * from './utils';

//------------------------------------------------------------------------------
// Storage
//------------------------------------------------------------------------------

/**
 * In-memory storage adapter for development and testing
 */
export * from './storage/memory';

//------------------------------------------------------------------------------
// Client
//------------------------------------------------------------------------------

/**
 * Client-side integration for implementing consent in browsers
 */
export * from './client';

/**
 * All client-related types bundled under a namespace to avoid conflicts
 */
export * as ClientTypes from './client/types';

/**
 * Selected client types needed for common use cases
 */
export type {
	c15tClientOptions,
	FetchOptions,
	ResponseContext,
} from './client/types';

//------------------------------------------------------------------------------
// Plugins
//------------------------------------------------------------------------------

/**
 * Analytics plugin for tracking user activity with consent
 */
export * from './plugins/analytics';

/**
 * Geo plugin for jurisdiction-based consent management
 */
export * from './plugins/geo';

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

/**
 * All system types bundled under a namespace to avoid conflicts
 */
export * as Types from './types';

/**
 * Plugin type extension point for type augmentation
 */
declare module './types/plugins' {
	interface PluginTypes {
		// Plugin type interfaces will be added here
	}
}

//------------------------------------------------------------------------------
// Framework Integrations (Commented out until implementation is complete)
//------------------------------------------------------------------------------

/*
// Next.js integration components and utilities
export {
	createNextIntegration,
	createNextMiddleware,
	withConsent
} from './integrations/next';

// React integration components and hooks
export {
	createReactIntegration,
	ConsentProvider,
	useConsent
} from './integrations/react';

// Generic server integration
export {
	createServerIntegration
} from './integrations/server';
*/
