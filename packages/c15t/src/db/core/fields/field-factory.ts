import type {
	FieldType,
	Field,
	FieldConfig,
	Primitive,
	JsonValue,
} from './field-types';
import type { InferValueType } from './field-inference';
import superjson from 'superjson';
import {
	getDatabaseType,
	parseFromDb,
	transformForDb,
} from './superjson-utils';

/**
 * Defines transform functions for field input and output operations.
 * Provides properly typed transform functions based on the field type.
 *
 * @template TFieldType - The field type that determines the transform function signatures
 *
 * @example
 * ```typescript
 * // Define transform functions for a string field
 * const nameTransformers: FieldTransformers<'string'> = {
 *   input: (value) => value.trim(),
 *   output: (value) => value.toUpperCase()
 * };
 * ```
 */
export type FieldTransformers<TFieldType extends FieldType> = {
	/**
	 * Transform function for field input.
	 * Applied when data is being saved to the database.
	 */
	input?: (value: InferValueType<TFieldType>) => Primitive | Promise<Primitive>;
	/**
	 * Transform function for field output.
	 * Applied when data is being retrieved from the database.
	 */
	output?: (
		value: InferValueType<TFieldType>
	) => Primitive | Promise<Primitive>;
};

/**
 * Extends the base field configuration with type-aware transform objects.
 *
 * @template TFieldType - The field type that determines the configuration
 *
 * @example
 * ```typescript
 * // Configuration for a string field with transforms
 * const emailConfig: TypedFieldOptions<'string'> = {
 *   required: true,
 *   transform: {
 *     input: (value) => value.toLowerCase().trim(),
 *     output: (value) => value
 *   },
 *   validator: (value) => value.includes('@') ? null : 'Invalid email'
 * };
 * ```
 */
export type TypedFieldOptions<TFieldType extends FieldType> = Omit<
	FieldConfig<TFieldType>,
	'transform'
> & {
	transform?: FieldTransformers<TFieldType>;
};

/**
 * Configuration options specific to number fields.
 * Provides additional validation options for number fields.
 *
 * @example
 * ```typescript
 * // Define a number field with min/max constraints
 * const ageField = numberField({
 *   required: true,
 *   min: 0,
 *   max: 120
 * });
 * ```
 */
export type NumberFieldOptions = {
	/**
	 * Minimum allowed value for the number field.
	 */
	min?: number;
	/**
	 * Maximum allowed value for the number field.
	 */
	max?: number;
};

/**
 * Configuration options specific to string fields.
 * Provides additional validation options for string fields.
 *
 * @example
 * ```typescript
 * // Define a string field with length constraints
 * const usernameField = stringField({
 *   required: true,
 *   minLength: 3,
 *   maxLength: 20
 * });
 * ```
 */
export type StringFieldOptions = {
	/**
	 * Minimum allowed length for the string field.
	 */
	minLength?: number;
	/**
	 * Maximum allowed length for the string field.
	 */
	maxLength?: number;
	/**
	 * Regular expression pattern that the string must match.
	 */
	pattern?: string;
};

/**
 * Configuration options specific to date fields.
 * Provides additional validation and formatting options for date fields.
 *
 * @example
 * ```typescript
 * // Define a date field with min/max date constraints
 * const birthdateField = dateField({
 *   required: true,
 *   minDate: new Date('1900-01-01'),
 *   maxDate: new Date() // Current date
 * });
 * ```
 */
export type DateFieldOptions = {
	/**
	 * Minimum allowed date value.
	 * Dates earlier than this will fail validation.
	 */
	minDate?: Date;

	/**
	 * Maximum allowed date value.
	 * Dates later than this will fail validation.
	 */
	maxDate?: Date;

	/**
	 * Whether to store just the date part without time information.
	 * When true, time components will be zeroed out.
	 * @default false
	 */
	dateOnly?: boolean;

	/**
	 * Format string for date output transformation.
	 * If provided, dates will be transformed to strings in this format.
	 * Only applies if no custom output transform is provided.
	 * Uses Intl.DateTimeFormat for consistent cross-platform formatting.
	 */
	format?: Intl.DateTimeFormatOptions;
};

/**
 * Configuration options specific to JSON fields.
 * Provides additional validation and schema options for JSON data.
 *
 * @example
 * ```typescript
 * // Define a JSON field with schema validation
 * const metadataField = jsonField({
 *   required: true,
 *   validator: (value) => {
 *     if (!value.hasOwnProperty('version')) return 'Missing version property';
 *     return null;
 *   }
 * });
 * ```
 */
export type JsonFieldOptions = {
	/**
	 * Whether to validate that the value is a valid JSON object.
	 * When true, the field will ensure the value can be properly stringified/parsed.
	 * @default true
	 */
	validateJson?: boolean;
};

/**
 * Common IANA timezone identifiers.
 * A subset of commonly used timezones from the IANA timezone database.
 * Used for validation and autocompletion in IDE.
 */
export const COMMON_TIMEZONES = {
	UTC: 'UTC',
	GMT: 'GMT',
	// North America
	EASTERN: 'America/New_York',
	CENTRAL: 'America/Chicago',
	MOUNTAIN: 'America/Denver',
	PACIFIC: 'America/Los_Angeles',
	// Europe
	LONDON: 'Europe/London',
	PARIS: 'Europe/Paris',
	BERLIN: 'Europe/Berlin',
	// Asia
	TOKYO: 'Asia/Tokyo',
	SHANGHAI: 'Asia/Shanghai',
	SINGAPORE: 'Asia/Singapore',
	// Australia
	SYDNEY: 'Australia/Sydney',
	// South America
	SAO_PAULO: 'America/Sao_Paulo',
} as const;

/**
 * Type representing common timezone identifiers.
 * String literal union type of common IANA timezone identifiers.
 */
export type CommonTimezone =
	(typeof COMMON_TIMEZONES)[keyof typeof COMMON_TIMEZONES];

/**
 * Configuration options specific to timezone fields.
 * Provides additional validation options for timezone fields.
 *
 * @example
 * ```typescript
 * // Define a timezone field with validation
 * const tzField = timezoneField({
 *   required: true,
 *   defaultValue: COMMON_TIMEZONES.UTC
 * });
 *
 * // Define a timezone field with suggested values
 * const userTimezone = timezoneField({
 *   required: true,
 *   suggestedValues: [
 *     COMMON_TIMEZONES.EASTERN,
 *     COMMON_TIMEZONES.CENTRAL,
 *     COMMON_TIMEZONES.PACIFIC
 *   ]
 * });
 * ```
 */
export type TimezoneFieldOptions = {
	/**
	 * Whether to validate the timezone format against IANA timezone database.
	 * When true, ensures the value is a valid IANA timezone name.
	 * @default true
	 */
	validateTimezone?: boolean;

	/**
	 * Suggested values for the timezone field.
	 * Can be used by client UIs to provide dropdown options.
	 */
	suggestedValues?: string[] | readonly string[];

	/**
	 * Whether to restrict values to only the provided suggestedValues.
	 * If true, values not in suggestedValues will fail validation.
	 * @default false
	 */
	restrictToSuggestedValues?: boolean;
};

/**
 * Creates a field attribute with the specified configuration.
 * This is the core function for defining schema fields with type safety.
 *
 * @template TFieldType - The field type to create
 * @template TConfig - The configuration type for the field
 *
 * @param type - The field type to create
 * @param config - Configuration options for the field
 * @returns A fully configured field definition
 *
 * @example
 * ```typescript
 * // Create a basic string field
 * const nameField = createField('string', {
 *   required: true
 * });
 *
 * // Create a number field with transforms
 * const ageField = createField('number', {
 *   required: false,
 *   transform: {
 *     input: (value) => Math.floor(value)
 *   }
 * });
 * ```
 */
export function createField<
	TFieldType extends FieldType,
	TConfig extends TypedFieldOptions<TFieldType> & Record<string, unknown>,
>(type: TFieldType, config: TConfig = {} as TConfig): Field<TFieldType> {
	const { transform, ...rest } = config;

	return {
		type,
		required: true,
		returned: true,
		input: true,
		bigint: false,
		sortable: true,
		...rest,
		...(transform
			? {
					transform: {
						...transform,
					},
				}
			: {}),
	} as Field<TFieldType>;
}

/**
 * Creates a string field with the specified configuration.
 * Convenience wrapper around createField with string type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field including string-specific options
 * @returns A fully configured string field definition
 *
 * @example
 * ```typescript
 * // Create a required string field
 * const nameField = stringField({ required: true });
 *
 * // Create a string field with validation
 * const emailField = stringField({
 *   required: true,
 *   pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
 *   transform: {
 *     input: (value) => value.toLowerCase().trim()
 *   },
 *   validator: (value) => value.includes('@') ? null : 'Invalid email'
 * });
 * ```
 */
export function stringField<
	TConfig extends TypedFieldOptions<'string'> & StringFieldOptions,
>(config: TConfig = {} as TConfig): Field<'string'> {
	return createField('string', config);
}

/**
 * Creates a number field with the specified configuration.
 * Convenience wrapper around createField with number type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field including number-specific options
 * @returns A fully configured number field definition
 *
 * @example
 * ```typescript
 * // Create a required number field
 * const scoreField = numberField({ required: true });
 *
 * // Create a number field with validation
 * const ageField = numberField({
 *   required: true,
 *   min: 0,
 *   max: 120,
 *   validator: (value) => value >= 18 ? null : 'Must be at least 18'
 * });
 * ```
 */
export function numberField<
	TConfig extends TypedFieldOptions<'number'> & NumberFieldOptions,
>(config: TConfig = {} as TConfig): Field<'number'> {
	return createField('number', config);
}

/**
 * Creates a boolean field with the specified configuration.
 * Convenience wrapper around createField with boolean type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured boolean field definition
 *
 * @example
 * ```typescript
 * // Create a required boolean field
 * const isActiveField = booleanField({ required: true });
 *
 * // Create a boolean field with default value
 * const isVerifiedField = booleanField({
 *   required: true,
 *   defaultValue: false
 * });
 * ```
 */
export function booleanField<TConfig extends TypedFieldOptions<'boolean'>>(
	config: TConfig = {} as TConfig
): Field<'boolean'> {
	return createField('boolean', config);
}

/**
 * Creates a date field with the specified configuration.
 * Convenience wrapper around createField with date type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured date field definition
 *
 * @example
 * ```typescript
 * // Create a required date field
 * const createdAtField = dateField({ required: true });
 *
 * // Create a date field with transform and default value
 * const lastLoginField = dateField({
 *   required: false,
 *   defaultValue: () => new Date(),
 *   transform: {
 *     output: (value) => value.toISOString()
 *   }
 * });
 *
 * // Create a date-only field with min/max validation
 * const birthdateField = dateField({
 *   required: true,
 *   dateOnly: true,
 *   minDate: new Date('1900-01-01'),
 *   maxDate: new Date(),
 *   format: {
 *     year: 'numeric',
 *     month: 'long',
 *     day: 'numeric'
 *   }
 * });
 * ```
 *
 * @remarks
 * The database-specific behavior of this field is as follows:
 * - **SQLite**: Uses a special date handling mechanism to preserve timezone information
 * - **MySQL**: Provides consistent timezone handling across deployments
 * - **PostgreSQL**: Uses native TIMESTAMPTZ type which handles timezones effectively
 */
export function dateField<
	TConfig extends TypedFieldOptions<'date'> & DateFieldOptions,
>(config: TConfig = {} as TConfig): Field<'date'> {
	const {
		transform = {},
		minDate,
		maxDate,
		dateOnly = false,
		format,
		...restConfig
	} = config;

	// Store the original transform functions
	const originalInputTransform = transform.input;
	const originalOutputTransform = transform.output;

	// Get the current database type
	const dbType = getDatabaseType();

	// Create database-aware transform functions for SQLite and MySQL
	const inputTransform = async (value: Date) => {
		// First apply the user's transform if provided
		let transformedValue = value;
		if (originalInputTransform) {
			transformedValue = (await originalInputTransform(value)) as Date;
		}

		// Strip time components if dateOnly is true
		if (dateOnly && transformedValue instanceof Date) {
			const dateOnlyValue = new Date(transformedValue);
			dateOnlyValue.setHours(0, 0, 0, 0);
			transformedValue = dateOnlyValue;
		}

		// Apply special handling for SQLite (and optionally MySQL) to preserve timezone info
		if (dbType === 'sqlite') {
			// For SQLite, we need to ensure timezone information is preserved
			// Use SuperJSON to stringify the date, which will maintain timezone info
			return superjson.stringify({ date: transformedValue });
		}

		return transformedValue;
	};

	const outputTransform = async (value: unknown) => {
		let parsedValue = value;

		// Handle SQLite date format (SuperJSON string)
		if (
			dbType === 'sqlite' &&
			typeof value === 'string' &&
			value.includes('"date"')
		) {
			try {
				const parsed = superjson.parse(value);
				// Use type assertion to handle the 'parsed' is of type 'unknown' error
				parsedValue = (parsed as { date: Date }).date;
			} catch {
				// If parsing fails, keep the original value
			}
		}

		// Apply the user's transform if provided
		if (originalOutputTransform && parsedValue instanceof Date) {
			parsedValue = await originalOutputTransform(parsedValue);
		}
		// Apply formatting if no custom transform was provided and format is specified
		else if (
			!originalOutputTransform &&
			format &&
			parsedValue instanceof Date
		) {
			parsedValue = new Intl.DateTimeFormat(undefined, format).format(
				parsedValue
			);
		}

		return parsedValue;
	};

	// Create a validator for min/max date constraints
	let validator = config.validator;
	if ((minDate || maxDate) && !validator) {
		validator = (value: Date) => {
			if (!(value instanceof Date)) {
				return 'Value must be a Date object';
			}

			if (minDate && value < minDate) {
				return `Date must not be earlier than ${minDate.toISOString()}`;
			}

			if (maxDate && value > maxDate) {
				return `Date must not be later than ${maxDate.toISOString()}`;
			}

			return null;
		};
	}
	// If there's already a validator and min/max constraints, chain them
	else if (
		(minDate || maxDate) &&
		validator &&
		typeof validator === 'function'
	) {
		const originalValidator = validator;
		validator = async (value: Date) => {
			if (!(value instanceof Date)) {
				return 'Value must be a Date object';
			}

			// Check min/max constraints
			if (minDate && value < minDate) {
				return `Date must not be earlier than ${minDate.toISOString()}`;
			}

			if (maxDate && value > maxDate) {
				return `Date must not be later than ${maxDate.toISOString()}`;
			}

			// Run the original validator
			return originalValidator(value);
		};
	}

	return createField('date', {
		...restConfig,
		transform: {
			input: inputTransform,
			output: outputTransform,
		},
		validator,
	});
}

/**
 * Creates a timezone field with the specified configuration.
 * Convenience wrapper around createField with timezone type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured timezone field definition
 *
 * @example
 * ```typescript
 * // Create a required timezone field with a default value
 * const timezoneField = {
 *   timezone: timezoneField({
 *     required: true,
 *     defaultValue: COMMON_TIMEZONES.UTC
 *   })
 * };
 *
 * // Create a timezone field with restricted values
 * const regionTimezone = timezoneField({
 *   required: true,
 *   suggestedValues: [
 *     COMMON_TIMEZONES.EASTERN,
 *     COMMON_TIMEZONES.CENTRAL,
 *     COMMON_TIMEZONES.MOUNTAIN,
 *     COMMON_TIMEZONES.PACIFIC
 *   ],
 *   restrictToSuggestedValues: true
 * });
 * ```
 *
 * @remarks
 * The timezone field stores timezone identifiers according to the IANA timezone database.
 * It validates timezone strings to ensure they are valid IANA timezone identifiers.
 */
export function timezoneField<
	TConfig extends TypedFieldOptions<'timezone'> & TimezoneFieldOptions,
>(config: TConfig = {} as TConfig): Field<'timezone'> {
	const {
		validateTimezone = true,
		suggestedValues,
		restrictToSuggestedValues = false,
		transform = {},
		...restConfig
	} = config;

	// Store the original transform functions
	const originalInputTransform = transform.input;
	const originalOutputTransform = transform.output;

	// Create a validator for timezone format if validation is enabled
	const validateIANATimezone = (timezone: string): string | null => {
		// If we're restricting to suggested values, check that first
		if (restrictToSuggestedValues && suggestedValues) {
			if (!suggestedValues.includes(timezone)) {
				return `Timezone must be one of the suggested values: ${suggestedValues.join(', ')}`;
			}
			// If it's in the suggested values, we can skip the Intl validation
			return null;
		}

		try {
			// Use Intl.DateTimeFormat to validate the timezone
			Intl.DateTimeFormat(undefined, { timeZone: timezone });
			return null;
		} catch {
			return 'Invalid timezone identifier. Must be a valid IANA timezone.';
		}
	};

	// Custom input transform that applies validation if enabled
	const inputTransform = async (value: string) => {
		// First apply the user's transform if provided
		let transformedValue = value;
		if (originalInputTransform) {
			// Properly type the transform function
			transformedValue = (await originalInputTransform(
				value as InferValueType<'timezone'>
			)) as string;
		}

		return transformedValue;
	};

	// Output transform
	const outputTransform = async (value: unknown) => {
		let parsedValue = value;

		// Then apply the user's transform if provided
		if (originalOutputTransform && typeof parsedValue === 'string') {
			// Properly type the transform function
			parsedValue = await originalOutputTransform(
				parsedValue as InferValueType<'timezone'>
			);
		}

		return parsedValue;
	};

	// Create the validator function
	const validator = validateTimezone
		? async (value: string) => {
				if (value === null || value === undefined) {
					return null;
				}
				return validateIANATimezone(value);
			}
		: config.validator;

	return createField('timezone', {
		...restConfig,
		transform: {
			input: inputTransform,
			output: outputTransform,
		},
		validator,
	});
}

/**
 * Creates a string array field with the specified configuration.
 * Convenience wrapper around createField with string[] type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured string array field definition
 *
 * @example
 * ```typescript
 * // Create a required string array field
 * const tagsField = stringArrayField({ required: true });
 *
 * // Create a string array field with default value
 * const categoriesField = stringArrayField({
 *   required: true,
 *   defaultValue: ['general']
 * });
 * ```
 */
export function stringArrayField<TConfig extends TypedFieldOptions<'string[]'>>(
	config: TConfig = {} as TConfig
): Field<'string[]'> {
	return createField('string[]', config);
}

/**
 * Creates a number array field with the specified configuration.
 * Convenience wrapper around createField with number[] type.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the field
 * @returns A fully configured number array field definition
 *
 * @example
 * ```typescript
 * // Create a required number array field
 * const scoresField = numberArrayField({ required: true });
 *
 * // Create a number array field with default value
 * const ratingsField = numberArrayField({
 *   required: true,
 *   defaultValue: [0, 0, 0]
 * });
 * ```
 */
export function numberArrayField<TConfig extends TypedFieldOptions<'number[]'>>(
	config: TConfig = {} as TConfig
): Field<'number[]'> {
	return createField('number[]', config);
}

/**
 * Creates a JSON field with the specified configuration.
 * Convenience wrapper around createField with json type.
 * Uses SuperJSON for enhanced JSON handling that supports additional types
 * like Date, Map, Set, BigInt, etc. beyond what native JSON serialization allows.
 *
 * @template TConfig - The configuration type for the field
 *
 * @param config - Configuration options for the JSON field
 * @returns A fully configured JSON field definition
 *
 * @example
 * ```typescript
 * // Create a basic JSON field
 * const configField = jsonField({ required: true });
 *
 * // Create a JSON field with custom transform and validation
 * const metadataField = jsonField({
 *   required: true,
 *   transform: {
 *     input: (value) => {
 *       // Add timestamp to all incoming JSON
 *       return { ...value, updatedAt: new Date().toISOString() };
 *     },
 *     output: (value) => {
 *       // Remove internal properties on output
 *       const { _internal, ...rest } = value;
 *       return rest;
 *     }
 *   },
 *   validator: (value) => {
 *     // Ensure the JSON has required fields
 *     if (!value.version) return 'Missing version field';
 *     return null;
 *   }
 * });
 * ```
 *
 * @remarks
 * The database-specific behavior of this field is as follows:
 * - **SQLite**: Always uses SuperJSON as SQLite has no native JSON support
 * - **MySQL**: Uses SuperJSON when complex JS types are detected (Date, Map, BigInt, etc.)
 * - **PostgreSQL**: Uses native JSON/JSONB storage for simple types, SuperJSON only when needed
 */
export function jsonField<
	TConfig extends TypedFieldOptions<'json'> & JsonFieldOptions,
>(config: TConfig = {} as TConfig): Field<'json'> {
	const { validateJson = true, transform = {}, ...restConfig } = config;

	// Store the original transform functions
	const originalInputTransform = transform.input;
	const originalOutputTransform = transform.output;

	// Create database-aware transform functions
	const inputTransform = async (value: JsonValue) => {
		// First apply the user's transform if provided
		let transformedValue = value;
		if (originalInputTransform) {
			// Use proper type casting to handle the transformation
			// We need to cast to InferValueType<'json'> which is what the transform expects
			const result = await originalInputTransform(
				value as unknown as InferValueType<'json'>
			);
			transformedValue = result as unknown as JsonValue;
		}

		// Then apply database-specific serialization
		return transformForDb(transformedValue);
	};

	const outputTransform = async (value: unknown) => {
		// First parse from database format
		let parsedValue = parseFromDb(value);

		// Then apply the user's transform if provided
		if (
			originalOutputTransform &&
			typeof parsedValue === 'object' &&
			parsedValue !== null
		) {
			// Use proper type casting to handle the transformation
			// We need to cast to InferValueType<'json'> which is what the transform expects
			parsedValue = await originalOutputTransform(
				parsedValue as unknown as InferValueType<'json'>
			);
		}

		return parsedValue;
	};

	let validator = config.validator;

	// If validateJson is true and no validator is specified, add JSON validation
	if (validateJson && !validator) {
		validator = (value: JsonValue) => {
			try {
				// Check if value can be properly serialized with SuperJSON
				superjson.stringify(value);
				return null;
			} catch (error) {
				return `Invalid JSON structure: ${(error as Error).message}`;
			}
		};
	}
	// If validateJson is true and there's an existing validator, chain them
	else if (validateJson && validator) {
		const originalValidator = validator;
		validator = (value: JsonValue) => {
			try {
				// First check if it's valid JSON with SuperJSON
				superjson.stringify(value);

				// Then run the original validator
				if (typeof originalValidator === 'function') {
					return originalValidator(value);
				}
				return null;
			} catch (error) {
				return `Invalid JSON structure: ${(error as Error).message}`;
			}
		};
	}

	return createField('json', {
		...restConfig,
		validator,
		transform: {
			input: inputTransform,
			output: outputTransform,
		},
	});
}

/**
 * Utility functions for working with dates and timezones.
 * Provides helper methods for common date and timezone operations.
 */
export const DateTimeUtils = {
	/**
	 * Creates a Date object in a specific timezone.
	 *
	 * @param dateInput - Date object or ISO string to convert
	 * @param timezone - Target timezone (IANA timezone identifier)
	 * @returns Date object adjusted for the specified timezone
	 */
	createDateInTimezone: (dateInput: Date | string, timezone: string): Date => {
		const date =
			typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);

		// Get the target timezone's current offset from UTC
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			timeZoneName: 'short',
		});

		// Format the date in the target timezone to get correct representation
		const formattedDate = formatter.format(date);
		return new Date(formattedDate);
	},

	/**
	 * Formats a date according to the specified timezone.
	 *
	 * @param date - The date to format
	 * @param timezone - Target timezone (IANA timezone identifier)
	 * @param options - Formatting options for Intl.DateTimeFormat
	 * @returns Formatted date string in the specified timezone
	 */
	formatInTimezone: (
		date: Date,
		timezone: string,
		options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			timeZoneName: 'short',
		}
	): string => {
		return new Intl.DateTimeFormat('en-US', {
			...options,
			timeZone: timezone,
		}).format(date);
	},

	/**
	 * Gets the current date in a specific timezone.
	 *
	 * @param timezone - Target timezone (IANA timezone identifier)
	 * @returns Current date adjusted for the specified timezone
	 */
	getNowInTimezone: (timezone: string): Date => {
		return DateTimeUtils.createDateInTimezone(new Date(), timezone);
	},

	/**
	 * Calculates the offset in minutes between the local timezone and the specified timezone.
	 *
	 * @param timezone - Target timezone (IANA timezone identifier)
	 * @param date - Optional date to calculate the offset for (defaults to current date)
	 * @returns Offset in minutes between local and specified timezone
	 */
	getTimezoneOffset: (timezone: string, date: Date = new Date()): number => {
		// Calculate the client's timezone offset in minutes
		const localOffset = date.getTimezoneOffset();

		// Get the target timezone offset
		const targetDate = new Date(
			date.toLocaleString('en-US', { timeZone: timezone })
		);
		const targetOffset = (date.getTime() - targetDate.getTime()) / 60000;

		return localOffset - targetOffset;
	},
};
