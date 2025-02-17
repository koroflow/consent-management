'use client';

import { SandboxProvider } from '@c15t/shadcn/components';
import { useTheme } from 'next-themes';
import { type ComponentProps, useEffect, useState } from 'react';

export type PreviewProviderProps = Omit<
	ComponentProps<typeof SandboxProvider>,
	'theme'
>;

export const PreviewProvider = ({
	options,
	...props
}: PreviewProviderProps) => {
	const { resolvedTheme } = useTheme();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	if (!isMounted) {
		return null;
	}

	return (
		<SandboxProvider
			theme={(resolvedTheme as 'light' | 'dark') ?? 'light'}
			{...props}
			options={{
				...options,
				externalResources: [...(options?.externalResources || [])],
			}}
		/>
	);
};
