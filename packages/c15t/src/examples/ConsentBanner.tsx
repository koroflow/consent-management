import { useState } from 'react';
import { useConsentManager } from '../integrations/react';

/**
 * Consent Banner Component
 * 
 * This component demonstrates how to use the c15t consent management system
 * in a React application. It provides a complete UI for:
 * 
 * - Displaying a consent banner when needed
 * - Allowing users to accept or decline all consent
 * - Customizing individual consent preferences
 * - Showing loading and error states
 * 
 * @example
 * ```tsx
 * // In your main layout or app component
 * import { ConsentBanner } from '@c15t/examples';
 * 
 * function App() {
 *   return (
 *     <>
 *       <ConsentBanner 
 *         baseUrl="/api/c15t" 
 *         refreshInterval={60000}
 *       />
 *       {/* Rest of your app */}
 *     </>
 *   );
 * }
 * ```
 */
export function ConsentBanner({
  baseUrl = '/api/c15t',
  refreshInterval = 60000,
  className = 'c15t-consent-banner',
  translations = {
    title: 'We value your privacy',
    description: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    acceptAll: 'Accept All',
    declineAll: 'Decline All',
    customize: 'Customize',
    save: 'Save Preferences',
    necessary: 'Necessary (Required)',
    analytics: 'Analytics',
    marketing: 'Marketing',
    preferences: 'Preferences',
    loading: 'Loading consent preferences...',
    error: 'Error loading consent preferences',
    retry: 'Retry',
  }
}) {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  
  const {
    isLoading,
    hasConsented,
    showBanner,
    preferences,
    error,
    acceptAll,
    declineAll,
    setPreference,
    savePreferences,
    refreshStatus,
    clearError,
  } = useConsentManager({
    baseUrl,
    refreshInterval,
    defaultPreferences: {
      analytics: true,
      marketing: true,
      preferences: true,
    }
  });
  
  // Don't show the banner if consent has been given or during server-side rendering
  if (!showBanner || typeof window === 'undefined') {
    return null;
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className={`${className} ${className}--loading`}>
        <div className={`${className}__content`}>
          <p>{translations.loading}</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className={`${className} ${className}--error`}>
        <div className={`${className}__content`}>
          <p>{translations.error}</p>
          <button 
            className={`${className}__button${className}__button--secondary`}
            onClick={() => {
              clearError();
              refreshStatus();
            }}
          >
            {translations.retry}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <div className={`${className}__content`}>
        <h2 className={`${className}__title`}>{translations.title}</h2>
        <p className={`${className}__description`}>{translations.description}</p>
        
        {customizeOpen ? (
          <>
            <div className={`${className}__options`}>
              {/* Required consent is always checked and disabled */}
              <div className={`${className}__option`}>
                <label className={`${className}__label`}>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled={true}
                    className={`${className}__checkbox`}
                  />
                  <span>{translations.necessary}</span>
                </label>
                <p className={`${className}__option-description`}>
                  These cookies are necessary for the website to function and cannot be disabled.
                </p>
              </div>
              
              {/* Analytics consent */}
              <div className={`${className}__option`}>
                <label className={`${className}__label`}>
                  <input
                    type="checkbox"
                    checked={preferences?.analytics || false}
                    onChange={e => setPreference('analytics', e.target.checked)}
                    className={`${className}__checkbox`}
                  />
                  <span>{translations.analytics}</span>
                </label>
                <p className={`${className}__option-description`}>
                  These cookies allow us to analyze site usage to measure and improve performance.
                </p>
              </div>
              
              {/* Marketing consent */}
              <div className={`${className}__option`}>
                <label className={`${className}__label`}>
                  <input
                    type="checkbox"
                    checked={preferences?.marketing || false}
                    onChange={e => setPreference('marketing', e.target.checked)}
                    className={`${className}__checkbox`}
                  />
                  <span>{translations.marketing}</span>
                </label>
                <p className={`${className}__option-description`}>
                  These cookies are used to track visitors across websites to display relevant advertisements.
                </p>
              </div>
              
              {/* Preferences consent */}
              <div className={`${className}__option`}>
                <label className={`${className}__label`}>
                  <input
                    type="checkbox"
                    checked={preferences?.preferences || false}
                    onChange={e => setPreference('preferences', e.target.checked)}
                    className={`${className}__checkbox`}
                  />
                  <span>{translations.preferences}</span>
                </label>
                <p className={`${className}__option-description`}>
                  These cookies enable personalized features and notifications.
                </p>
              </div>
            </div>
            
            <div className={`${className}__actions`}>
              <button
                className={`${className}__button${className}__button--primary`}
                onClick={async () => {
                  await savePreferences();
                  setCustomizeOpen(false);
                }}
              >
                {translations.save}
              </button>
            </div>
          </>
        ) : (
          <div className={`${className}__actions`}>
            <button
              className={`${className}__button${className}__button--primary`}
              onClick={acceptAll}
            >
              {translations.acceptAll}
            </button>
            <button
              className={`${className}__button${className}__button--secondary`}
              onClick={declineAll}
            >
              {translations.declineAll}
            </button>
            <button
              className={`${className}__button${className}__button--tertiary`}
              onClick={() => setCustomizeOpen(true)}
            >
              {translations.customize}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 