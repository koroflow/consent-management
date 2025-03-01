import type { C15TOptions } from '~/types';
import type { InferFieldsOutput, InferFieldsInput } from './field-inference';

/**
 * Infers field types from plugin definitions.
 * Allows extraction of field types from plugins registered in C15TOptions.
 *
 * @template Options - The C15T configuration options
 * @template Key - The schema key to extract fields from
 * @template Format - Whether to use input or output format
 */
export type InferFieldsFromPlugins<
	Options extends C15TOptions,
	Key extends string,
	Format extends 'output' | 'input' = 'output',
> = Options['plugins'] extends Array<infer T>
	? T extends {
			schema: {
				[key in Key]: {
					fields: infer Field;
				};
			};
		}
		? Format extends 'output'
			? InferFieldsOutput<Field>
			: InferFieldsInput<Field>
		: Record<string, never>
	: Record<string, never>;

/**
 * Infers field types from C15T options for specific modules.
 * Used to extract additional field definitions from various C15T configuration sections.
 *
 * @template Options - The C15T configuration options
 * @template Key - The specific module configuration to extract from
 * @template Format - Whether to use input or output format
 */
export type InferFieldsFromOptions<
	Options extends C15TOptions,
	Key extends
		| 'consent'
		| 'purpose'
		| 'record'
		| 'consentGeoLocation'
		| 'withdrawal'
		| 'auditLog'
		| 'user',
	Format extends 'output' | 'input' = 'output',
> = Options[Key] extends {
	additionalFields: infer Field;
}
	? Format extends 'output'
		? InferFieldsOutput<Field>
		: InferFieldsInput<Field>
	: Record<string, never>;
