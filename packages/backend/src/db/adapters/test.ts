import { expect, test } from 'vitest';

import type { C15TOptions } from '~/types';
import { generateId } from '../core/fields';
import type { Adapter } from './types';

interface AdapterTestOptions {
	name: string;
  expectedAdapterId: string;
	getAdapter: (
		customOptions?: Omit<C15TOptions, 'storage'>
	) => Promise<Adapter>;
	skipGenerateIdTest?: boolean;
	skipTransactionTest?: boolean;
}

export function runAdapterTests(opts: AdapterTestOptions) {
	let adapter: Adapter;

	// Setup before tests
	test(`${opts.name}: initialize adapter`, async () => {
		adapter = await opts.getAdapter();
		expect(adapter).toBeDefined();
		expect(adapter.id).toBe(opts.expectedAdapterId);
	});

	// Individual test cases
	test(`${opts.name}: create subject`, async () => {
		const testId = generateId('sub');

		const res = await adapter.create({
			model: 'subject',
			data: {
				id: testId,
				isIdentified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		expect(res).toBeDefined();
		//@ts-expect-error - id is not a field on the subject model
		expect(res.id).toBe(testId);
	});

	test(`${opts.name}: find subject`, async () => {
		// Create a subject first
		const testId = generateId('sub');
		await adapter.create({
			model: 'subject',
			data: {
				id: testId,
				isIdentified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		});

		const res = await adapter.findOne({
			model: 'subject',
			where: [
				{
					field: 'id',
					value: testId,
				},
			],
		});

		expect(res).toBeDefined();
		//@ts-expect-error - id is not a field on the subject model
		expect(res?.id).toBe(testId);
	});
}
