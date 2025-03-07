import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	serverExternalPackages: ['@libsql/client', '@libsql/kysely-libsql', 'libsql'],
};

export default nextConfig;
