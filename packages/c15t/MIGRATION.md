# Migrating from Core to c15t

This guide provides step-by-step instructions for migrating from the legacy `core` library to the new `@c15t` package for consent management.

## Why Migrate?

The new `@c15t` package offers several advantages over the legacy `core` library:

- **Lighter weight**: Reduced bundle size with no dependencies on Zustand
- **Improved performance**: Optimized store implementation with efficient updates
- **Better TypeScript support**: Full type safety and intelligent autocomplete
- **Framework agnostic**: Works with any UI framework, not just React
- **Modern API**: Clean, consistent API design with better error handling
- **Enhanced privacy features**: Better support for complex compliance scenarios

## Migration Steps

### 1. Install the new package

```bash
# Using npm
npm install @c15t

# Using yarn
yarn add @c15t

# Using pnpm
pnpm add @c15t
```

### 2. Update Imports

Change your imports from the legacy core package to the new c15t package:

```diff
- import { createConsentManagerStore } from '@core/store';
+ import { createCompatibilityStore } from '@c15t/integrations/react';
```

### 3. Replace Store Initialization

Replace the legacy store initialization with the new compatibility layer:

```diff
- const store = createConsentManagerStore('MyApp', {
-   consentBannerApiUrl: '/api/consent-banner',
-   trackingBlockerConfig: { /* ... */ }
- });
+ const store = createCompatibilityStore({
+   baseUrl: '/api/c15t',
+   refreshInterval: 60000,
+   defaultPreferences: {
+     analytics: true,
+     marketing: true,
+     preferences: true,
+   }
+ });
```

### 4. Use the New React Hook (Optional but Recommended)

For component-level access, use the new React hook instead of accessing the store directly:

```diff
- import { useConsentStore } from '@core/react';
+ import { useConsentManager } from '@c15t/integrations/react';

  function ConsentBanner() {
-   const { showPopup, consents, saveConsents } = useConsentStore();
+   const { showBanner, preferences, acceptAll, declineAll } = useConsentManager({
+     baseUrl: '/api/c15t',
+     refreshInterval: 60000
+   });
  
-   if (!showPopup) return null;
+   if (!showBanner) return null;
    
    return (
      <div className="consent-banner">
        <h2>We use cookies</h2>
        <div className="actions">
-         <button onClick={() => saveConsents('all')}>Accept All</button>
-         <button onClick={() => saveConsents('necessary')}>Decline All</button>
+         <button onClick={acceptAll}>Accept All</button>
+         <button onClick={declineAll}>Decline All</button>
        </div>
      </div>
    );
  }
```

### 5. Conditional Content Rendering

Update conditional content rendering:

```diff
- import { useConsentStore } from '@core/react';
+ import { useConditionalContent } from '@c15t/integrations/react';

  function AnalyticsComponent() {
-   const { hasConsentFor } = useConsentStore();
-   const canShowAnalytics = hasConsentFor('analytics');
+   const { canShow, isLoading } = useConditionalContent('analytics');
  
-   if (!canShowAnalytics) return null;
+   if (isLoading) return <div>Loading...</div>;
+   if (!canShow) return null;
    
    return <div>Analytics content</div>;
  }
```

### 6. API Endpoints

Update your API routes to match the new c15t endpoints:

```diff
- // /api/consent-banner
+ // /api/c15t/status
  
- // /api/save-consent
+ // /api/c15t/set
```

### 7. Using Example Components (Optional)

c15t provides ready-to-use example components:

```tsx
import { Examples } from '@c15t';

function App() {
  return (
    <>
      <Examples.ConsentBanner 
        baseUrl="/api/c15t" 
        refreshInterval={60000}
      />
      {/* Rest of your app */}
    </>
  );
}
```

## Server-Side Integration

If you're using server-side integration, update your server code:

```diff
- import { createConsentServer } from '@core/server';
+ import { c15t } from '@c15t';
+ import { createServerAdapter } from '@c15t/integrations/server';

- const consentServer = createConsentServer({
-   // server config
- });
+ const consentManager = c15t({
+   secret: process.env.SECRET_KEY,
+   storage: memoryAdapter(),
+   // other options
+ });
+ 
+ const serverAdapter = createServerAdapter(consentManager);
  
- app.use('/api/consent', consentServer.handler);
+ app.use('/api/c15t', serverAdapter.handler);
```

## Next.js Integration

For Next.js applications:

```diff
- import { withConsent } from '@core/next';
+ import { withConsentPages, withConsentApi } from '@c15t/integrations/next';

- export default withConsent(MyApp);
+ export default withConsentPages(MyApp);
  
- // In API route
- export default withConsent(myApiHandler);
+ // In API route
+ export default withConsentApi(myApiHandler);
```

## Need Help?

If you encounter any issues during migration, please:

1. Check the [full documentation](https://docs.c15t.com)
2. File an issue on [GitHub](https://github.com/yourorg/c15t)
3. Reach out to support@c15t.com

## Compatibility Layer Limitations

The compatibility layer (`createCompatibilityStore`) provides a bridge between the old and new APIs, but has some limitations:

- Some advanced features of the legacy API have no direct equivalent
- UI state management is simplified and may require custom implementation
- Some callback behaviors differ slightly

For new projects, it's recommended to use the new APIs directly instead of the compatibility layer. 