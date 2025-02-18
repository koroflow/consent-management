import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { docs, meta } from '../../.source';

export const docsSource = loader({
	baseUrl: '/docs',
	source: createMDXSource(docs, meta),
});

export type Source = typeof docsSource;
