import type { ReactNode } from 'react';
import { CodeBlock } from '~/components/marketing/codeblock';
import { Section } from '~/components/marketing/section';
import { ExamplesClient } from './examples.client';

interface FeatureOption {
	id: number;
	title: string;
	description: string;
	code: ReactNode;
}

const featureOptions: FeatureOption[] = [
	{
		id: 1,
		title: 'Simple Cookie Banner',
		description: 'Create a simple cookie banner with a basic theme.',
		code: (
			<CodeBlock
				lang="jsx"
				code={`import { ConsentManagerProvider,ConsentManagerDialog, CookieBanner } from "@c15t/react"

function Layout({ children }: { children: ReactNode }) {
  return (
    <ConsentManagerProvider>
      <CookieBanner />
      <ConsentManagerDialog/>
      {children}
    </ConsentManagerProvider>
  )
}`}
			/>
		),
	},

	{
		id: 2,
		title: 'Themed Cookie Banner',
		description: 'Customize the Cookie Banner with a modern theme.',
		code: (
			<CodeBlock
				lang="jsx"
				code={`import { ConsentManagerProvider,ConsentManagerDialog,CookieBanner } from "@c15t/react"

const modernTheme = {
  'cookie-banner.root':
    'fixed bottom-0 w-full p-4 bg-white backdrop-blur-sm z-50',
  'cookie-banner.card': 'max-w-2xl mx-auto rounded-lg',
  'cookie-banner.header.title':
    'text-lg font-semibold text-gray-900',
  'cookie-banner.header.description':
    'mt-2 text-sm text-gray-600',
  'cookie-banner.footer': 'flex justify-end gap-4',
  'cookie-banner.footer.sub-group': 'flex flex-row gap-2',
  'cookie-banner.footer.reject-button':
    'bg-red-600 text-white hover:bg-red-700 px-2 py-1 rounded-md',
	'cookie-banner.footer.accept-button': 
    'bg-blue-600 text-white hover:bg-blue-700 px-2 py-1 rounded-md    ',
	cookie-banner.footer.customize-button': 
    'bg-gray-100 text-gray-900 hover:bg-gray-200 px-2 py-1 rounded-md',
}

function BasicCookieBanner() {
  return (
    <ConsentManagerProvider>
      <CookieBanner theme={modernTheme} />
      <ConsentManagerDialog/>
    </ConsentManagerProvider>
  )
}`}
			/>
		),
	},
];

export function Examples() {
	return (
		<Section id="examples" title="Examples">
			<ExamplesClient features={featureOptions} />
		</Section>
	);
}
