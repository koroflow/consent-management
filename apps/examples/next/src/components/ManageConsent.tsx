'use client';

import { useState } from 'react';
import { useConsent } from '~/hooks/useConsent';

export function ManageConsent() {
  const [showSettings, setShowSettings] = useState(false);
  const { loading, consented, preferences, updateConsent, acceptAll, rejectAll } = useConsent();

  if (loading || !consented) {
    return null;
  }

  return (
    <div>
      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className='relative m-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900'>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
              <span className="sr-only">Close</span>
            </button>
            
            <h3 className='mb-4 font-bold text-lg'>Manage Cookie Preferences</h3>
            <p className='mb-6 text-gray-600 text-sm dark:text-gray-400'>
              You can update your consent preferences for cookies at any time.
            </p>
            
            <div className='mb-6 space-y-4'>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics Cookies</h4>
                  <p className='text-gray-600 text-xs dark:text-gray-400'>
                    Help us improve our website by collecting anonymous usage data
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateConsent({ analytics: !preferences.analytics })}
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
                <div>
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className='text-gray-600 text-xs dark:text-gray-400'>
                    Track your browsing habits to display relevant ads
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateConsent({ marketing: !preferences.marketing })}
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
                <div>
                  <h4 className="font-medium">Preferences Cookies</h4>
                  <p className='text-gray-600 text-xs dark:text-gray-400'>
                    Remember your settings and preferences for a better experience
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateConsent({ preferences: !preferences.preferences })}
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
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={rejectAll}
                className='rounded border border-gray-300 px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'
              >
                Reject All
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className='rounded bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700'
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className='rounded bg-gray-800 px-3 py-1.5 text-sm text-white transition-colors hover:bg-gray-700'
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className='flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Manage Cookie Preferences
        </button>
      )}
    </div>
  );
} 