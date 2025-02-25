import { c15tMiddleware, toNextJsHandler } from '@c15t/next';

export const { GET, POST } = toNextJsHandler(c15tMiddleware.handler);
