import { remarkInstall } from 'fumadocs-docgen';
import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

export const { docs, meta } = defineDocs({
	dir: ['src/content'],
});

export default defineConfig({
	mdxOptions: {
		remarkPlugins: [remarkInstall],
	},
});
