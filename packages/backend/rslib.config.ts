import { defineConfig } from '@rslib/core';

const externals = [
	// Database packages
	'prisma',
	'@prisma/client',
	'better-sqlite3',
	'mongodb',
	'drizzle-orm',
	'bson',
	'mongodb-connection-string-url',
	'@mongodb-js/saslprep',
	'kerberos',
	'@mongodb-js/zstd',
	'@aws-sdk/credential-providers',
	'mongodb-client-encryption',

	// UI frameworks
	'react',
	'vue',
	'solid-js',
	'solid-js/store',
	'next/headers',
	'$app/environment',
	'@vue/runtime-dom',
	'@vue/runtime-core',
	'@vue/shared',
	'@vue/reactivity',
	'@vue/compiler-dom',
	'@vue/compiler-core',
	'csstype',

	// Testing libraries
	'vitest',
	'@vitest/runner',
	'@vitest/utils',
	'@vitest/expect',
	'@vitest/snapshot',
	'@vitest/spy',
	'chai',
	'tinyspy',

	// Utilities and others
	'pathe',
	'std-env',
	'magic-string',
	'pretty-format',
	'p-limit',
	'next/dist/compiled/@edge-runtime/cookies',
	'@babel/types',
	'@babel/parser',
	'punycode',
];

export default defineConfig({
	source: {
		entry: {
			index: ['./src/index.ts'],
			'db/migration/index': ['./src/db/migration/index.ts'],
			'types/index': ['./src/types/index.ts'],
			'utils/index': ['./src/utils/index.ts'],
			'client/index': ['./src/client/index.ts'],
			'db/adapters/prisma': ['./src/db/adapters/prisma-adapter/index.ts'],
			'db/adapters/drizzle': [
				'./src/db/adapters/drizzle-adapter/drizzle-adapter.ts',
			],
			'db/adapters/memory': [
				'./src/db/adapters/memory-adapter/memory-adapter.ts',
			],
			'db/adapters/kysely': [
				'./src/db/adapters/kysely-adapter/kysely-adapter.ts',
			],
			'error/index': ['./src/error/index.ts'],
			'error/codes': ['./src/error/codes.ts'],
			'integrations/index': ['./src/integrations/index.ts'],
			'integrations/next': ['./src/integrations/next.ts'],
			'integrations/react': ['./src/integrations/react.ts'],
			'db/index': ['./src/db/index.ts'],
		},
	},
	lib: [
		{
			dts: true,
			bundle: true,
			format: 'esm',
			output: {
				externals,
			},
		},
		{
			dts: true,
			bundle: true,
			format: 'cjs',
			output: {
				externals,
			},
		},
	],
	output: {
		target: 'node',
		cleanDistPath: true,
		externals,
	},
});
