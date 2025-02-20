import type { ReactNode } from 'react';
import { docsSource } from '~/lib/source';

import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HeaderBg } from '~/components/docs/header-bg';
import { Footer } from '../(home)/_components/footer';
import { docsOptions } from '../layout.config';

/**
 * Layout component that wraps all documentation pages.
 * Provides consistent navigation, sidebar and structure across doc pages.
 *
 * @param props - The component props
 * @param props.children - The page content to be wrapped by the layout
 * @returns The rendered layout with navigation and child content
 */
export default function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="relative">
			{/* Background Pattern */}
			<HeaderBg className="fixed top-[calc(var(--fd-banner-height)+104px)]" />

			<DocsLayout
				tree={docsSource.pageTree}
				tabMode="navbar"
				{...docsOptions}
				nav={{ ...docsOptions.nav, mode: 'top' }}
			>
				{children}
			</DocsLayout>
			<Footer />
		</div>
	);
}
