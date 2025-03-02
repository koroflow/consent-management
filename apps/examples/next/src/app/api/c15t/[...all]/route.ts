import { toNextJsHandler } from "@c15t/new/integrations";
import { c15t } from "~/lib/c15t";

export const { GET, POST } = toNextJsHandler(c15t.handler);
