export const pages = {
	'App.tsx': `import { ConsentManagerProvider, ConsentManagerDialog, CookieBanner } from '@c15t/react';
import { ExampleContent } from './ExampleContent';
import { clearLocalStorage } from './lib/utils';

export default function App() {
    // Clear localStorage on mount to ensure a clean state
    clearLocalStorage();

    return (
        <ConsentManagerProvider 
            initialGdprTypes={['necessary', 'marketing']}
        >
            <CookieBanner 
              noStyle
              theme={{
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
								'cookie-banner.footer.customize-button':
									'bg-gray-100 text-gray-900 hover:bg-gray-200 px-2 py-1 rounded-md',
							}} />
            <ConsentManagerDialog />
            <ExampleContent />
        </ConsentManagerProvider>
    );
}`,

	'ExampleContent.tsx': `import { useConsentManager } from '@c15t/react';
import { setupDarkMode } from './lib/utils';
import { useEffect } from 'react';

export function ExampleContent() {
    const { setShowPopup, getConsent } = useConsentManager();
    
    // Setup dark mode handling
    useEffect(() => setupDarkMode(), []);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center gap-4 dark:bg-[#18191c] p-4">
         	  <main className="mx-auto max-w-2xl text-center">
					    <div className="bg-gradient-to-t light:from-black/40 dark:from-white/40 light:to-black/10 dark:to-white/10 bg-clip-text font-bold text-[60px] text-transparent leading-none tracking-tighter">c15t.com</div>
			      </main>
        </div>
    );
}`,
};
