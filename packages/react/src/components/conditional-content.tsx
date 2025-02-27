import type { ReactNode } from 'react';
import { useConditionalContent } from '../hooks/use-conditional-content';

export interface ConditionalContentProps {
  /**
   * Required consent purpose(s) to show content. Can be a single string or array of strings.
   */
  requiredConsent: string | string[];
  
  /**
   * Content to render when the user has consented to all required purposes.
   */
  children: ReactNode;
  
  /**
   * Optional content to render while loading consent state.
   */
  loadingContent?: ReactNode;
  
  /**
   * Optional content to render when the user has not consented.
   */
  fallbackContent?: ReactNode;
}

/**
 * Component that conditionally renders content based on user consent.
 * 
 * @example
 * ```tsx
 * import { ConditionalContent } from '@c15t/react';
 * 
 * function MyComponent() {
 *   return (
 *     <ConditionalContent 
 *       requiredConsent="analytics"
 *       fallbackContent={<div>Please enable analytics consent to view this content</div>}
 *       loadingContent={<div>Loading...</div>}
 *     >
 *       <div>Analytics content is shown because you consented!</div>
 *     </ConditionalContent>
 *   );
 * }
 * ```
 */
export function ConditionalContent({
  requiredConsent,
  children,
  loadingContent = null,
  fallbackContent = null,
}: ConditionalContentProps) {
  const { isLoading, canShow } = useConditionalContent(requiredConsent);
  
  if (isLoading) {
    return <>{loadingContent}</>;
  }
  
  if (!canShow) {
    return <>{fallbackContent}</>;
  }
  
  return <>{children}</>;
} 