export function toNextJsHandler(
	auth:
		| {
				handler: (request: Request) => Promise<Response>;
		  }
		| ((request: Request) => Promise<Response>)
) {
	// biome-ignore lint/suspicious/useAwait: its what nextjs expects
	const handler = async (request: Request) => {
		return 'handler' in auth ? auth.handler(request) : auth(request);
	};
	return {
		GET: handler,
		POST: handler,
	};
}
