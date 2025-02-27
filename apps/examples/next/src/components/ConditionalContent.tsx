'use client';

import { useConsent } from '~/hooks/useConsent';

export function ConditionalContent() {
  const { loading, consented, preferences } = useConsent();

  if (loading) {
    return (
      <div className='animate-pulse rounded-md bg-gray-100 p-4 dark:bg-gray-800'>
        <div className='mb-2 h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-700'></div>
        <div className='h-4 w-1/2 rounded bg-gray-300 dark:bg-gray-700'></div>
      </div>
    );
  }

  // If user hasn't consented yet, show placeholder
  if (!consented) {
    return (
      <div className='rounded-md bg-gray-100 p-4 dark:bg-gray-800'>
        <p className='text-gray-600 text-sm dark:text-gray-400'>
          Please accept cookies to see personalized content.
        </p>
      </div>
    );
  }

  // Custom content based on specific consent preferences
  return (
    <div className="space-y-4">
      {preferences.analytics && (
        <div className='rounded-md bg-blue-50 p-4 dark:bg-blue-900/20'>
          <h3 className='mb-1 font-medium'>Analytics Features</h3>
          <p className='text-gray-600 text-sm dark:text-gray-400'>
            Thank you for allowing analytics! We use this data to improve your experience.
          </p>
        </div>
      )}
      
      {preferences.marketing && (
        <div className='rounded-md bg-green-50 p-4 dark:bg-green-900/20'>
          <h3 className='mb-1 font-medium'>Personalized Recommendations</h3>
          <p className='text-gray-600 text-sm dark:text-gray-400'>
            Based on your preferences, you might be interested in our new features.
          </p>
        </div>
      )}
      
      {preferences.preferences && (
        <div className='rounded-md bg-purple-50 p-4 dark:bg-purple-900/20'>
          <h3 className='mb-1 font-medium'>Saved Preferences</h3>
          <p className='text-gray-600 text-sm dark:text-gray-400'>
            Your preferences have been saved for a better browsing experience.
          </p>
        </div>
      )}
      
      {!preferences.analytics && !preferences.marketing && !preferences.preferences && (
        <div className='rounded-md bg-gray-100 p-4 dark:bg-gray-800'>
          <p className='text-gray-600 text-sm dark:text-gray-400'>
            You've declined all optional cookies. Only essential functionality is enabled.
          </p>
        </div>
      )}
    </div>
  );
} 