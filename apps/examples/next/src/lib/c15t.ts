import { c15t as c15tInstance } from '@c15t/new';
import { LibsqlDialect } from '@libsql/kysely-libsql';

// Create a new shared instance of c15t with configuration
export const c15t = c15tInstance({
	appName: 'Next.js Example App',
  basePath: '/api/c15t',
	// Add any trusted origins if needed
	trustedOrigins: ['http://localhost:3000'],
	// Configure storage adapter
  database: {
    dialect: new LibsqlDialect({
      url: process.env.TURSO_DATABASE_URL || "",
      authToken: process.env.TURSO_AUTH_TOKEN || "",
    }),
    type: "sqlite" 
  },
	// Configure consent options
	consent: {
		expiresIn: 60 * 60 * 24 * 365, // 1 year in seconds
		updateAge: 60 * 60 * 24, // 24 hours in seconds
	},
	// plugins: [geo(), analytics()],
	// Enable analytics plugin if needed
	analytics: {
		enabled: true,
	},
});
