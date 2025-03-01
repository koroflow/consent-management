import type { Adapter, C15TOptions } from '../types';
interface AdapterTestOptions {
	getAdapter: (
		customOptions?: Omit<C15TOptions, 'database'>
	) => Promise<Adapter>;
	skipGenerateIdTest?: boolean;
}

export async function runAdapterTest(opts: AdapterTestOptions) {
	const adapter = await opts.getAdapter();
	const user = {
		id: '1',
		name: 'user',
		email: 'user@email.com',
		emailVerified: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// test('create model', async () => {
	// 	const res = await adapter.create({
	// 		model: 'user',
	// 		data: user,
	// 	});
	// 	expect({
	// 		name: res.name,
	// 		email: res.email,
	// 	}).toEqual({
	// 		name: user.name,
	// 		email: user.email,
	// 	});
	// 	user.id = res.id;
	// });

	// test.skipIf(opts.skipGenerateIdTest)(
	// 	'should prefer generateId if provided',
	// 	async () => {
	// 		const customAdapter = await opts.getAdapter({
	// 			advanced: {
	// 				generateId: () => 'mocked-id',
	// 			},
	// 		});

	// 		const res = await customAdapter.create({
	// 			model: 'user',
	// 			data: {
	// 				id: '1',
	// 				name: 'user4',
	// 				email: 'user4@email.com',
	// 				emailVerified: true,
	// 				createdAt: new Date(),
	// 				updatedAt: new Date(),
	// 			},
	// 		});

	// 		expect(res.id).toBe('mocked-id');
	// 	}
	// );
}
