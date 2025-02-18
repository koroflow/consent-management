import { GithubIcon } from '~/components/icons/github';
import { XIcon } from '~/components/icons/x';
import { BlueSkyIcon } from '../icons/bsky';
import { DiscordIcon } from '../icons/discord';

export const navigation = {
	mainLinks: [
		{
			type: 'icon',
			url: 'https://github.com/koroflow/consent-management',
			text: 'Github',
			icon: <GithubIcon className="h-5 w-5" />,
			external: true,
		},
		{
			type: 'icon',
			url: 'https://x.com/koroflow',
			text: 'X',
			icon: <XIcon className="h-5 w-5" />,
			external: true,
		},
		{
			type: 'icon',
			url: 'https://bsky.app/profile/koroflow.bsky.social',
			text: 'BlueSky',
			icon: <BlueSkyIcon className="h-5 w-5" />,
			external: true,
		},
		{
			type: 'icon',
			url: 'https://c15t.com/discord',
			text: 'Discord',
			icon: <DiscordIcon className="h-5 w-5" />,
			external: true,
		},
	],
	secondaryLinks: [
		{ name: 'Getting Started', href: '/docs/getting-started' },
		{ name: 'Core', href: '/docs/core' },
		{ name: 'React', href: '/docs/framework/react' },
		// {
		// 	name: 'Privacy Regulations',
		// 	href: '/docs/privacy-regulations',
		// },
		// { name: 'Release Notes', href: '/docs/release-notes' },
	],
};
