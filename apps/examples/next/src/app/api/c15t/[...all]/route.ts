import { toNextJsHandler } from '@c15t/backend/integrations';
import { c15t } from '~/lib/c15t';

export const { GET, POST } = toNextJsHandler(c15t);
