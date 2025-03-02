import { defineConfig } from '@rslib/core';

const externals = [
	'prisma',
	'@prisma/client',
	'better-sqlite3',
	'react',
	'vue',
	'solid-js',
	'solid-js/store',
	'next/headers',
	'$app/environment',
	'vitest',
	'@vitest/runner',
	'@vitest/utils',
	'@vitest/expect',
	'@vitest/snapshot',
	'@vitest/spy',
	'chai',
	'mongodb',
	'drizzle-orm',
	'pathe',
	'std-env',
	'magic-string',
	'pretty-format',
	'p-limit',
	'tinyspy',
	'next/dist/compiled/@edge-runtime/cookies',
	'bson',
	'mongodb-connection-string-url',
	'@mongodb-js/saslprep',
	'kerberos',
	'@mongodb-js/zstd',
	'@aws-sdk/credential-providers',
	'mongodb-client-encryption',
	'@vue/runtime-dom',
	'@vue/runtime-core',
	'@vue/shared',
	'@vue/reactivity',
	'@vue/compiler-dom',
	'@vue/compiler-core',
	'@babel/types',
	'@babel/parser',
	'punycode',
	'csstype',
];

export default defineConfig({
	source: {
		entry: {
			index: ['./src/index.ts'],
			migration: ['./src/db/migration/index.ts'],
			// core: ['./src/core/index.ts'],
			// init: ['./src/init/index.ts'],
			// cookies: ['./src/cookies/index.ts'],
			types: ['./src/types/index.ts'],
			utils: ['./src/utils/index.ts'],
			client: ['./src/client/index.ts'],
			// plugins: ['./src/plugins/index.ts'],
			'adapters/prisma': ['./src/db/adapters/prisma-adapter/index.ts'],
			'adapters/drizzle': [
				'./src/db/adapters/drizzle-adapter/drizzle-adapter.ts',
			],
			'adapters/memory': ['./src/db/adapters/memory-adapter/memory-adapter.ts'],
			// 'plugins/analytics': ['./src/plugins/analytics.ts'],
			// 'plugins/geo': ['./src/plugins/geo.ts'],
			error: ['./src/error/index.ts'],
			'error/codes': ['./src/error/codes.ts'],
			integrations: ['./src/integrations/index.ts'],
			'integrations/next': ['./src/integrations/next.ts'],
			'integrations/react': ['./src/integrations/react.ts'],
			db: ['./src/db/index.ts'],
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
		target: 'web',
		cleanDistPath: true,
		externals,
	},
});
