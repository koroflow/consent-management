# c15t Next.js Integration

This guide shows how to integrate c15t into your Next.js application for consent management.

## Quick Start

Follow these steps to add c15t to your Next.js project:

1. Install the c15t package:
   ```bash
   npm install @c15t/new
   # or
   yarn add @c15t/new
   # or
   pnpm add @c15t/new
   ```

2. Create a shared c15t instance:
   ```typescript
   // lib/c15t.ts
   import { c15t } from '@c15t/new';
   import { memoryAdapter } from '@c15t/new/storage/memory';
   
   export const c15tInstance = c15t({
     appName: 'My Next.js App',
     trustedOrigins: ['http://localhost:3000'],
     storage: memoryAdapter(), // Use a persistent adapter for production
     consent: {
       expiresIn: 60 * 60 * 24 * 365, // 1 year
       updateAge: 60 * 60 * 24, // 24 hours
     },
   });
   ```

3. Create the API route handler:
   ```typescript
   // app/api/consent/[...route]/route.ts
   import { toNextJsHandler } from '@c15t/new/integrations/next';
   import { c15tInstance } from '@/lib/c15t';
   
   // Export all HTTP methods
   export const { GET, POST, PUT, DELETE, OPTIONS } = toNextJsHandler(c15tInstance);
   ```

4. Create a React client for client components:
   ```typescript
   // lib/consent-client.ts
   import { createConsentClient } from '@c15t/new/integrations/react';
   
   export const consentClient = createConsentClient({
     baseUrl: '/api/consent',
     refreshInterval: 60 * 1000, // Check every minute (optional)
   });
   
   // Export hooks for use in components
   export const { useConsent, useConditionalContent } = consentClient;
   ```

## Usage Examples

### Client Components

#### Consent Banner
```tsx
// components/ConsentBanner.tsx
'use client';
import { useConsent } from '@/lib/consent-client';

export function ConsentBanner() {
  const { isLoading, hasConsented, acceptAll, declineAll } = useConsent();
  
  if (isLoading || hasConsented) {
    return null;
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
      <h3>Cookie Consent</h3>
      <p>We use cookies to improve your experience.</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => acceptAll()}>Accept All</button>
        <button onClick={() => declineAll()}>Decline All</button>
      </div>
    </div>
  );
}
```

#### Conditional Content
```tsx
// components/AnalyticsContent.tsx
'use client';
import { useConditionalContent } from '@/lib/consent-client';

export function AnalyticsContent() {
  const { isLoading, canShow } = useConditionalContent('analytics');
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!canShow) {
    return <div>Please accept analytics cookies to view this content.</div>;
  }
  
  return <div>Analytics content visible!</div>;
}
```

### Server Components and Actions

#### Server Component with Consent Check
```tsx
// app/protected-content/page.tsx
import { getServerConsent } from '@c15t/new/integrations/server';
import { headers } from 'next/headers';
import { c15tInstance } from '@/lib/c15t';

export default async function ProtectedPage() {
  const consent = await getServerConsent(c15tInstance, { headers: headers() });
  
  if (!consent.consented) {
    return (
      <div>
        <h1>Consent Required</h1>
        <p>Please accept cookies to view this content.</p>
      </div>
    );
  }
  
  // User has consented, show protected content
  return (
    <div>
      <h1>Protected Content</h1>
      <p>This content is only visible to users who have provided consent.</p>
    </div>
  );
}
```

#### Server Action to Update Consent
```tsx
// app/actions.ts
'use server'
import { setServerConsent } from '@c15t/new/integrations/server';
import { cookies } from 'next/headers';
import { c15tInstance } from '@/lib/c15t';

export async function acceptAllCookies() {
  return await setServerConsent(
    c15tInstance,
    { 
      preferences: { analytics: true, marketing: true, preferences: true } 
    },
    { cookies: cookies() }
  );
}

export async function rejectAllCookies() {
  return await setServerConsent(
    c15tInstance,
    { 
      preferences: { analytics: false, marketing: false, preferences: false } 
    },
    { cookies: cookies() }
  );
}
```

### Middleware for Consent Checking

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { checkConsentCookie } from '@c15t/new/integrations/next';

export function middleware(request) {
  // Check if user has provided consent
  const hasConsent = checkConsentCookie(request);
  
  // For routes that require consent, redirect to consent page if not consented
  if (!hasConsent && request.nextUrl.pathname.startsWith('/protected')) {
    return NextResponse.redirect(new URL('/consent', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/protected/:path*'],
};
```

## Advanced Configuration

### Using a Different Storage Adapter

For production use, consider using a persistent storage adapter:

```typescript
// lib/c15t.ts
import { c15t } from '@c15t/new';
import { cookieAdapter } from '@c15t/new/storage/cookie';

export const c15tInstance = c15t({
  // ... other config
  storage: cookieAdapter({
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }),
});
```

### Custom Consent Preferences

You can define custom consent categories beyond the standard ones:

```typescript
// lib/consent-client.ts
import { createConsentClient } from '@c15t/new/integrations/react';

export const consentClient = createConsentClient({
  defaultPreferences: {
    analytics: true,
    marketing: true,
    preferences: true,
    thirdParty: true, // Custom category
    personalization: true, // Custom category
  },
});
```

## Troubleshooting

### Common Issues

1. **API Route Not Found**: Make sure your route file is placed correctly at `app/api/consent/[...route]/route.ts` or adjust your c15t configuration to match your route path.

2. **Cookie Not Set**: Ensure your API calls include `credentials: 'same-origin'` to allow cookies to be set. For server actions, make sure you're using the `cookies()` helper.

3. **CORS Issues**: If accessing the API from a different origin, configure the `trustedOrigins` in your c15t instance. 