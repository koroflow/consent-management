import { toNextJsHandler } from "@c15t/new/integrations";
import { C15TInstance } from "~/lib/c15t";

export const { GET, POST } = toNextJsHandler(C15TInstance.handler);
