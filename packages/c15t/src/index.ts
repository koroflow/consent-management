// Core exports
export * from './core';
export * from './types';
export * from './error/codes';
export * from './cookies';
export * from './utils';

// Storage adapters
export * from './storage/memory';

// Client
export * from './client';
// Import client types with explicit naming to avoid conflicts
// biome-ignore lint/nursery/noExportedImports: <explanation>
import * as ClientTypes from './client/types';
// Re-export client types with namespacing to avoid conflicts
export { ClientTypes };
// Export specific client types needed by the client implementation
export type {
	C15tClientOptions,
	FetchOptions,
	ResponseContext,
} from './client/types';

// Export integrations with explicit names to avoid ambiguity
/*
import { 
	createNextIntegration,
	createNextMiddleware,
	withConsent
} from './integrations/next';

import {
	createReactIntegration,
	ConsentProvider,
	useConsent
} from './integrations/react';

import {
	createServerIntegration
} from './integrations/server';

// Named exports instead of re-exporting everything
export {
	createNextIntegration,
	createNextMiddleware,
	withConsent,
	createReactIntegration,
	ConsentProvider,
	useConsent,
	createServerIntegration
};
*/

// Remove the wildcard export to avoid ambiguity
// export * from './integrations';

// Plugins
export * from './plugins/analytics';
export * from './plugins/geo';

// Declare plugin type module augmentation point
declare module './types/plugins' {
	interface PluginTypes {
		// Plugin type interfaces will be added here
	}
}
