import {
	ConsentManagerDialog,
	ConsentManagerProvider,
	CookieBanner,
} from '@c15t/react';
import type { ReactNode } from 'react';

export const ConsentManagerLayout = ({ children }: { children: ReactNode }) => {
	return (
		<ConsentManagerProvider initialGdprTypes={['necessary', 'marketing']}>
			{children}
			<CookieBanner />
			<ConsentManagerDialog />
		</ConsentManagerProvider>
	);
};
