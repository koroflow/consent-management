import { analytics, c15t, geo, memoryAdapter } from '@c15t/new';

// Create a new shared instance of c15t with configuration
export const C15TInstance = c15t({
	appName: 'Next.js Example App',
	// Add any trusted origins if needed
	trustedOrigins: ['http://localhost:3000'],
	// Configure storage adapter
	storage: memoryAdapter(),
	// Configure consent options
	consent: {
		expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
		updateAge: 60 * 60 * 24, // 24 hours in seconds
	},
	plugins: [geo(), analytics()],
	// Enable analytics plugin if needed
	analytics: {
		enabled: true,
	},
});
