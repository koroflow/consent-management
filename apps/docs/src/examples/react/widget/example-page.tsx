export const pages = {
	'CustomWidget.tsx': `
'use client';
import { useConsentManager } from '@c15t/react';
import * as ConsentManagerWidget from '@c15t/react/consent-manager-widget';

export function CustomWidget() {
	const { hasConsented } = useConsentManager();

	// If the user has consented, don't show the dialog
	if (hasConsented()) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="w-full max-w-md rounded-lg bg-white p-4 pb-6 dark:bg-stone-900">
				<h1 className="mb-4 font-bold text-2xl">Custom Dialog & Widget</h1>
				<ConsentManagerWidget.Root>
					<ConsentManagerWidget.Accordion>
						<ConsentManagerWidget.AccordionItems />
					</ConsentManagerWidget.Accordion>
					<ConsentManagerWidget.Footer className="mt-4 flex flex-row justify-between">
						<ConsentManagerWidget.FooterSubGroup>
							<ConsentManagerWidget.RejectButton>
								Reject All
							</ConsentManagerWidget.RejectButton>
							<ConsentManagerWidget.AcceptAllButton>
								Accept All
							</ConsentManagerWidget.AcceptAllButton>
						</ConsentManagerWidget.FooterSubGroup>
						<ConsentManagerWidget.SaveButton>
							Save
						</ConsentManagerWidget.SaveButton>
					</ConsentManagerWidget.Footer>
				</ConsentManagerWidget.Root>
			</div>
		</div>
	);
}
`,
	'App.tsx': `
import { ConsentManagerProvider, ConsentManagerDialog, CookieBanner } from '@c15t/react';
import { ExampleContent } from './ExampleContent';
import { clearLocalStorage } from './lib/utils';
import { CustomWidget } from './CustomWidget';

export default function App() {
    // Clear localStorage on mount to ensure a clean state
    clearLocalStorage();

    return (
        <ConsentManagerProvider 
            initialGdprTypes={['necessary', 'marketing']}
        >
            <CustomWidget />
            <ExampleContent />
        </ConsentManagerProvider>
    );
}`,
	'ExampleContent.tsx': `
import { useConsentManager } from '@c15t/react';
import { useEffect } from 'react';
import { setupDarkMode } from './lib/utils';

export function ExampleContent() {
	const { setShowPopup, getConsent } = useConsentManager();

	// Setup dark mode handling
	useEffect(() => setupDarkMode(), []);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 dark:bg-[#18191c]">
			<main className="mx-auto max-w-2xl text-center">
				<div className="bg-gradient-to-t light:from-black/40 light:to-black/10 bg-clip-text font-bold text-[60px] text-transparent leading-none tracking-tighter dark:from-white/40 dark:to-white/10">
					c15t.com
				</div>
			</main>
		</div>
	);
}
`,
};
