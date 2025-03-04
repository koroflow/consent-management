import { describe, it, expect, vi, beforeEach } from 'vitest';
import { c15tInstance } from './core';
import { memoryAdapter } from './db/adapters/memory-adapter';
import type { C15TPlugin } from './types';

describe('c15tInstance', () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
	});

	it('should create an instance with basic configuration', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
		});

		expect(instance.options.baseURL).toBe('http://localhost:3000');
		const context = await instance.$context;
		expect(context.isOk()).toBe(true);
		if (context.isOk()) {
			expect(context.value.appName).toBe('c15t Consent Manager');
		}
	});

	it('should handle requests with proper routing', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:8080',
			database: memoryAdapter({}),
		});

		const request = new Request('http://localhost:8080/api/c15t/status', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Origin: 'http://localhost:8080',
			},
		});
		const response = await instance.handler(request);
		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			expect(response.value.status).toBe(200);
		}
	});

	it('should return correct status response structure', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:8080',
			database: memoryAdapter({}),
		});

		const request = new Request('http://localhost:8080/api/c15t/status', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Origin: 'http://localhost:8080',
			},
		});

		const response = await instance.handler(request);
		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			const responseData = await response.value.json();

			// Check response structure
			expect(responseData).toHaveProperty('status', 'ok');
			expect(responseData).toHaveProperty('version');
			expect(responseData).toHaveProperty('timestamp');
			expect(responseData).toHaveProperty('storage');

			// Check storage object structure
			expect(responseData.storage).toHaveProperty('type', 'memory');
			expect(responseData.storage).toHaveProperty('available', true);

			// Check timestamp format
			expect(new Date(responseData.timestamp).toISOString()).toBe(
				responseData.timestamp
			);

			// Check version format (semver)
			// biome-ignore lint/performance/useTopLevelRegex: <explanation>
			expect(responseData.version).toMatch(/^\d+\.\d+\.\d+$/);
		}
	});

	it('should handle requests with custom base path', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			basePath: '/custom-path',
			database: memoryAdapter({}),
		});

		const request = new Request('http://localhost:3000/custom-path/status');
		const response = await instance.handler(request);

		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			expect(response.value.status).toBe(200);
		}
	});

	it('should handle requests with plugins', async () => {
		const testPlugin: C15TPlugin = {
			id: 'test-plugin',
			name: 'Test Plugin',
			type: 'test',
			init: () => ({
				context: {
					appName: 'Modified App Name',
				},
			}),
		};

		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
			plugins: [testPlugin],
		});

		const context = await instance.$context;
		expect(context.isOk()).toBe(true);
		if (context.isOk()) {
			expect(context.value.appName).toBe('Modified App Name');
		}
	});

	it('should handle API endpoint retrieval', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
		});

		const api = await instance.getApi();
		expect(api.isOk()).toBe(true);
		if (api.isOk()) {
			expect(api.value).toBeDefined();
			expect(typeof api.value).toBe('object');
		}
	});

	it('should handle invalid requests gracefully', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
		});

		const request = new Request(
			'http://localhost:3000/api/c15t/invalid-endpoint'
		);
		const response = await instance.handler(request);

		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			expect(response.value.status).toBe(404);
		}
	});

	it('should handle trusted origins configuration', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
			trustedOrigins: ['http://trusted.test'],
		});

		const context = await instance.$context;
		expect(context.isOk()).toBe(true);
		if (context.isOk()) {
			expect(context.value.trustedOrigins).toContain('http://localhost:3000');
			expect(context.value.trustedOrigins).toContain('http://trusted.test');
		}
	});

	it('should handle dynamic trusted origins', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
			trustedOrigins: (request) => [request.headers.get('origin') || ''],
		});

		const request = new Request('http://localhost:3000/api/c15t/health', {
			headers: { origin: 'http://dynamic.test' },
		});

		const response = await instance.handler(request);
		expect(response.isOk()).toBe(true);

		const context = await instance.$context;
		expect(context.isOk()).toBe(true);
		if (context.isOk()) {
			expect(context.value.trustedOrigins).toContain('http://dynamic.test');
		}
	});

	it('should handle plugin initialization errors gracefully', async () => {
		const errorPlugin: C15TPlugin = {
			id: 'error-plugin',
			name: 'Error Plugin',
			type: 'test',
			init: () => {
				throw new Error('Plugin initialization failed');
			},
		};

		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
			plugins: [errorPlugin],
		});

		const context = await instance.$context;
		expect(context.isErr()).toBe(true);
		if (context.isErr()) {
			expect(context.error.message).toContain('Plugin initialization failed');
		}
	});

	it('should handle base URL with trailing slash', async () => {
		const instance = c15tInstance({
			baseURL: 'http://localhost:3000/',
			database: memoryAdapter({}),
		});

		const request = new Request('http://localhost:3000/api/c15t/status', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Origin: 'http://localhost:3000',
			},
		});
		const response = await instance.handler(request);
		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			expect(response.value.status).toBe(200);
		}
	});

	it('should handle plugin response modification', async () => {
		const responsePlugin: C15TPlugin = {
			id: 'response-plugin',
			name: 'Response Plugin',
			type: 'test',
			onResponse: async (response, ctx) => {
				const data = await response.clone().json();
				return {
					response: new Response(JSON.stringify({ ...data, modified: true }), {
						status: response.status,
						headers: response.headers,
					}),
				};
			},
		};

		const instance = c15tInstance({
			baseURL: 'http://localhost:3000',
			database: memoryAdapter({}),
			plugins: [responsePlugin],
		});

		const request = new Request('http://localhost:3000/api/c15t/status', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				Origin: 'http://localhost:3000',
			},
		});
		const response = await instance.handler(request);
		expect(response.isOk()).toBe(true);
		if (response.isOk()) {
			const data = await response.value.clone().json();
			expect(data.modified).toBe(true);
		}
	});
});
