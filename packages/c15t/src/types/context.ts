import type { EndpointContext, InputContext } from 'better-call';
import type { ConsentContext } from '.';

export type HookEndpointContext = EndpointContext<string, any> &
	Omit<InputContext<string, any>, 'method'> & {
		context: ConsentContext & {
			returned?: unknown;
			responseHeaders?: Headers;
		};
		headers?: Headers;
	};

export type GenericEndpointContext = EndpointContext<string, any> & {
	context: ConsentContext;
};
