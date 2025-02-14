import {
	Brain,
	CodeIcon,
	LanguagesIcon,
	NetworkIcon,
	ServerIcon,
	ShieldIcon,
	ZapIcon,
} from 'lucide-react';
import { ReactIcon } from '~/components/icons/react';

export const siteConfig = {
	name: 'Consent Management',
	description:
		'Leverage native React components for seamless integration and high performance in a robust content management solution that empowers your development team while prioritizing privacy and compliance.',
	url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
	keywords: [
		'Privacy Management',
		'GDPR Compliance',
		'Consent Management',
		'Privacy Infrastructure',
		'Consent Infrastructure',
	],
	links: {
		email: 'support@consent-management.com',
		twitter: 'https://x.com/koroflow',
		github: 'https://github.com/koroflow/consent-management',
	},
	hero: {
		title: 'Content Management Redefined',
		description:
			'Leverage native React components for seamless integration and high performance in a robust content management solution that empowers your development team while prioritizing privacy and compliance.',
		cta: { text: 'Get Started', href: '/docs/framework/react' },
		demo: {
			text: 'Book A Demo',
			href: 'https://cal.com/christopherburns/koroflow',
		},
	},
	features: [
		{
			name: 'Developer Experience',
			description: 'TypeScript-first APIs that feel natural to use.',
			icon: <CodeIcon className="h-6 w-6" />,
		},
		{
			name: 'React Components',
			description:
				'Beautiful UI components built on Radix Primitives. Ready to go.',
			icon: <ReactIcon className="h-6 w-6" />,
		},
		{
			name: 'Headless Options',
			description: 'No UI, no bloat, just the tools you need.',
			icon: <Brain className="h-6 w-6" />,
		},
		{
			name: 'i18n included',
			description: 'Built-in internationalization support.',
			icon: <LanguagesIcon className="h-6 w-6" />,
		},
		{
			name: 'Automatic Fetch / XHR Blocking',
			description:
				'Automatically block fetch and XHR requests until consent is granted.',
			icon: <NetworkIcon className="h-6 w-6" />,
		},
		{
			name: 'Performance First',
			description: 'Minimal bundle impact, tree-shakable.',
			icon: <ZapIcon className="h-6 w-6" />,
		},
		{
			name: 'Privacy by Design',
			description: 'Built-in GDPR compliance and privacy best practices.',
			icon: <ShieldIcon className="h-6 w-6" />,
		},
		{
			name: 'Open Source',
			description: 'GNU3 license and open source from day one.',
			icon: <ServerIcon className="h-6 w-6" />,
		},
	],
	footer: {
		links: [
			{
				title: 'Product',
				items: [
					{ text: 'Documentation', url: '/docs' },
					{ text: 'Components', url: '/docs/framework/react' },
					{ text: 'Privacy Regulations', url: '/docs/privacy-regulations' },
				],
			},
			{
				title: 'Company',
				items: [
					{
						text: 'GitHub',
						url: 'https://github.com/koroflow/consent-management',
						external: true,
					},
					{ text: 'Twitter', url: 'https://x.com/koroflow', external: true },
					{
						text: 'Contact',
						url: 'mailto:support@consent-management.com',
						external: true,
					},
				],
			},
			{
				title: 'Legal',
				items: [
					{ text: 'Privacy Policy', url: '/privacy' },
					{ text: 'Terms of Service', url: '/terms' },
				],
			},
		],
		bottomText:
			'Leverage native React components for seamless integration and high performance in a robust content management solution that empowers your development team while prioritizing privacy and compliance.',
	},
};

export type SiteConfig = typeof siteConfig;
