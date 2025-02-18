import { cn } from '@c15t/shadcn/libs';

import { createTypeTable } from 'fumadocs-typescript/ui';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from 'fumadocs-ui/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { Card } from '~/components/docs/card';
import { CodeBlock } from '~/components/docs/codeblock';
import { Installer } from '~/components/docs/installer';
import { PoweredBy } from '~/components/docs/powered-by';
import { Preview } from '~/components/docs/preview';
import { Tab, Tabs } from '~/components/docs/tabs';
import type { Source } from '~/lib/source';

const { AutoTypeTable } = createTypeTable();

/**
 * Custom MDX components used for rendering documentation content
 */
const components = {
	...defaultMdxComponents,
	AutoTypeTable,
	Tabs,
	Tab,
	Installer,
	Preview,
	PoweredBy,
	Steps,
	Step,
	Card,
	CodeBlock,
};

/**
 * Props for the SharedDocsPage component
 *
 * @interface SharedDocsPageProps
 * @property {Object} params - The route parameters
 * @property {string[]} [params.slug] - Optional array of path segments representing the current page path
 * @property {Source} source - The documentation source containing page data and content
 */
interface SharedDocsPageProps {
	params: { slug?: string[] };
	source: Source;
	otherComponents?: Record<string, ComponentType>;
}

/**
 * A shared page component for rendering documentation content with consistent structure
 * and styling across different documentation sections.
 *
 * @component
 * @param {SharedDocsPageProps} props - The component props
 * @param {Object} props.params - The route parameters
 * @param {Source} props.source - The documentation source
 * @returns {JSX.Element} The rendered documentation page
 * @throws {NotFoundError} When the requested page is not found in the source
 *
 * @example
 * ```tsx
 * <SharedDocsPage
 *   params={{ slug: ['getting-started'] }}
 *   source={myDocsSource}
 * />
 * ```
 */
export function SharedDocsPage({
	params,
	source,
	otherComponents,
}: SharedDocsPageProps) {
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	const MDX = page.data.body;

	return (
		<DocsPage
			toc={page.data.toc}
			full={page.data.full}
			tableOfContent={{ style: 'clerk' }}
		>
			<DocsTitle className="tracking-tighter lg:text-4xl">
				{page.data.title}
			</DocsTitle>
			<DocsDescription>{page.data.description}</DocsDescription>
			<DocsBody className={cn()}>
				<MDX components={{ ...components, ...otherComponents }} />
			</DocsBody>
		</DocsPage>
	);
}

/**
 * Generates metadata for a documentation page based on its content.
 *
 * @param {Object} params - The route parameters
 * @param {string[]} [params.slug] - Optional array of path segments representing the current page path
 * @param {Source} source - The documentation source containing page data
 * @returns {Metadata} The page metadata including title, description and OpenGraph data
 * @throws {NotFoundError} When the requested page is not found in the source
 *
 * @example
 * ```tsx
 * const metadata = generateSharedMetadata(
 *   { slug: ['getting-started'] },
 *   myDocsSource
 * );
 * ```
 */
export function generateSharedMetadata(
	params: { slug?: string[] },
	source: Source
): Metadata {
	const page = source.getPage(params.slug);

	if (!page) {
		notFound();
	}

	return {
		title: page.data.title,
		description: page.data.description,
		openGraph: {
			title: page.data.title,
			description: page.data.description,
			type: 'website',
			images: [
				{
					url: `/og?slug=${params.slug?.join('/') ?? ''}`,
					width: 1200,
					height: 630,
				},
			],
		},
	};
}
