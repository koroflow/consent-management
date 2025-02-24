import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX({
	configPath: './source.config.ts',
});

/** @type {import('next').NextConfig} */
const config = {
	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				hostname: 'img.logo.dev',
				protocol: 'https',
			},
		],
	},
	reactStrictMode: true,
	// biome-ignore lint/suspicious/useAwait: <explanation>
	async redirects() {
		return [
			{
				source: '/docs',
				destination: '/docs/getting-started',
				permanent: true,
			},
			{
				source: '/discord',
				destination: 'https://discord.gg/nPJjrw55TZ',
				permanent: false,
			},
			{
				source: '/docs/framework/react/consent-solution',
				destination: '/docs/framework/react/index',
				permanent: true,
			},
		];
	},
};

export default withMDX(config);
