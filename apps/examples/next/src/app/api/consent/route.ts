import { toNextJsHandler } from '@c15t/temp/integrations/next';
import { c15tInstance } from '~/lib/c15t';

// Create handlers for all HTTP methods using the C15t instance
export const GET = toNextJsHandler(c15tInstance, 'handler');
export const POST = toNextJsHandler(c15tInstance, 'handler');
export const PUT = toNextJsHandler(c15tInstance, 'handler');
export const DELETE = toNextJsHandler(c15tInstance, 'handler');
export const OPTIONS = toNextJsHandler(c15tInstance, 'handler');