import { describe, it, expect, beforeEach } from 'vitest';
import { status } from '../status';
import { createMockContext } from '~/test/utils';
import type { C15TContext } from '~/types';

describe('Status Endpoint', () => {
	let mockContext: C15TContext;

	beforeEach(() => {
		mockContext = createMockContext();
	});

	it('should return status response', async () => {
		const response = await status({
			context: mockContext,
			params: undefined,
			query: undefined,
			body: undefined,
		});

		expect(response.status).toBe('ok');
	});

	it('should include version in context', async () => {
		const response = await status({
			context: mockContext,
			params: undefined,
			query: undefined,
			body: undefined,
		});

		expect(response.status).toBe('ok');
		expect(response.version).toBeDefined();
		expect(typeof response.version).toBe('string');
	});
});
