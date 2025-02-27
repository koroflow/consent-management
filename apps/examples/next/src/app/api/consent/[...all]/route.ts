import { toNextJsHandler } from '@c15t/new/integrations/next';
import { c15tInstance } from '~/lib/c15t';

/**
 * Export all HTTP methods using the Next.js handler
 */
export const GET = toNextJsHandler(c15tInstance, 'handler');
export const POST = toNextJsHandler(c15tInstance, 'handler');
export const PUT = toNextJsHandler(c15tInstance, 'handler');
export const DELETE = toNextJsHandler(c15tInstance, 'handler');
export const OPTIONS = toNextJsHandler(c15tInstance, 'handler'); 