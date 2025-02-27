'use client';

import { useState } from 'react';
import { useConsent } from '~/hooks/useConsent';

export function ConsentBanner() {
	const [showDetails, setShowDetails] = useState(false);
	const { loading, consented, preferences, updateConsent, acceptAll, rejectAll } = useConsent();
	
  console.log(consented, preferences)
	// Don't show the banner if still loading or if already consented
	if (loading || consented) {
		return null;
	}

	const handlePreferenceChange = (key: keyof typeof preferences) => {
		updateConsent({ [key]: !preferences[key] });
	};

	return (
		<div className='fixed right-0 bottom-0 left-0 z-50 border-gray-200 border-t bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-black'>
			<div className='container mx-auto max-w-4xl'>
				<h2 className='mb-2 font-bold text-lg'>Cookie Consent</h2>
				<p className="mb-4">
					We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
				</p>
				
				{showDetails && (
					<div className='mb-4 flex flex-col space-y-2'>
						<div className="flex items-center justify-between">
							<span>Analytics Cookies</span>
							<button
								type="button"
								onClick={() => handlePreferenceChange('analytics')}
								className={`relative h-5 w-10 rounded-full transition-colors duration-200 ease-in-out ${
									preferences.analytics ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
										preferences.analytics ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>
						
						<div className="flex items-center justify-between">
							<span>Marketing Cookies</span>
							<button
								type="button"
								onClick={() => handlePreferenceChange('marketing')}
								className={`relative h-5 w-10 rounded-full transition-colors duration-200 ease-in-out ${
									preferences.marketing ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
										preferences.marketing ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>
						
						<div className="flex items-center justify-between">
							<span>Preferences Cookies</span>
							<button
								type="button"
								onClick={() => handlePreferenceChange('preferences')}
								className={`relative h-5 w-10 rounded-full transition-colors duration-200 ease-in-out ${
									preferences.preferences ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
								}`}
							>
								<span
									className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
										preferences.preferences ? 'translate-x-5' : 'translate-x-0'
									}`}
								/>
							</button>
						</div>
					</div>
				)}
				
				<div className='flex flex-col justify-end space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0'>
					{!showDetails && (
						<button
							type="button"
							onClick={() => setShowDetails(true)}
							className='rounded-md border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
						>
							Customize
						</button>
					)}
					
					{showDetails && (
						<>
							<button
								type="button"
								onClick={rejectAll}
								className='rounded-md border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
							>
								Reject All
							</button>
							<button
								type="button"
								onClick={() => setShowDetails(false)}
								className='rounded-md border border-gray-300 px-4 py-2 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
							>
								Save Preferences
							</button>
						</>
					)}
					
					<button
						type="button"
						onClick={acceptAll}
						className='rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
					>
						Accept All
					</button>
				</div>
			</div>
		</div>
	);
}
