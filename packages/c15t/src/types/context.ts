import type { EndpointContext, InputContext } from 'better-call';
import type { C15TContext } from '.';

export type HookEndpointContext = EndpointContext<string, any> &
	Omit<InputContext<string, any>, 'method'> & {
		context: C15TContext & {
			returned?: unknown;
			responseHeaders?: Headers;
		};
		headers?: Headers;
	};

export type GenericEndpointContext = EndpointContext<string, any> & {
	context: C15TContext;
};
