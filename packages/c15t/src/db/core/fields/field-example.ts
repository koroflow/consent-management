/**
 * Examples demonstrating the usage of type-safe field creation functions
 * This file is for documentation purposes only
 */

import {
	stringField,
	numberField,
	booleanField,
	dateField,
	stringArrayField,
	numberArrayField,
	createFieldAttribute,
} from './field-factory';

// Example of a simple model schema using the type-safe field creators
const userSchema = {
	// Using specific field type functions for better type safety and inference
	id: stringField({ required: true, unique: true }),

	name: stringField({
		required: true,
		sortable: true,
		// Type-safe transform functions - input type is properly inferred as string
		transform: {
			input: (value) => value.trim().toLowerCase(),
			output: (value) => value.charAt(0).toUpperCase() + value.slice(1),
		},
	}),

	email: stringField({
		required: true,
		unique: true,
		// Type-safe transform function - input type is properly inferred as string
		transform: {
			input: (value) => value.toLowerCase(),
		},
	}),

	age: numberField({
		required: false,
		// Type-safe transform function - input type is properly inferred as number
		transform: {
			input: (value) => Math.max(0, Math.floor(value)),
			output: (value) => (value < 18 ? null : value),
		},
	}),

	isActive: booleanField({ defaultValue: true }),

	createdAt: dateField({
		defaultValue: () => new Date(),
		// Type-safe transform function - input type is properly inferred as Date
		transform: {
			output: (value) => value, // Date is correctly typed here
		},
	}),

	tags: stringArrayField({
		// Type-safe transform function - input type is properly inferred as string[]
		transform: {
			input: (values) => values.map((tag) => tag.trim().toLowerCase()),
		},
	}),

	scores: numberArrayField({
		// Type-safe transform function - input type is properly inferred as number[]
		transform: {
			input: (values) => values.filter((score) => score >= 0),
		},
	}),

	// Using the generic createFieldAttribute for flexibility
	rank: createFieldAttribute('number', {
		required: false,
		bigint: true, // This is allowed because we're using 'number' type
		// Type-safe transform function
		transform: {
			input: (value) => Math.min(100, Math.max(1, value)),
		},
	}),
};

// Type inference works correctly with the new implementation
type UserSchema = typeof userSchema;
type UserIdField = UserSchema['id']; // FieldAttribute<'string'>

// This demonstrates the improved type safety
// TypeScript will catch this error because 'sortable' is only valid for string fields
// Uncomment to see the error:
// const invalidField = numberField({ sortable: true });

// Similarly, 'bigint' is only valid for number fields
// Uncomment to see the error:
// const invalidStringField = stringField({ bigint: true });

// The correct usage would be:
const validNumberField = numberField({
	bigint: true,
	transform: {
		// Type safety ensures value is a number
		input: (value) => value * 2,
	},
});

// Field with default value gets proper typing
const nameWithDefault = stringField({
	defaultValue: 'Default Name',
	sortable: true, // This is allowed for string fields
	// Type-safe transform
	transform: {
		// Type safety ensures value is a string
		input: (value) => value.trim(),
		output: (value) => value.toUpperCase(),
	},
});

// Using the generic factory with type-specific options
const powerField = createFieldAttribute('number', {
	required: true,
	bigint: true, // This is allowed because we're using 'number' type
	transform: {
		input: (value) => Math.abs(value),
	},
});

// Combination of options for more complex cases
const categoryField = createFieldAttribute('string', {
	required: true,
	sortable: true, // This is allowed because we're using 'string' type
	unique: true,
	transform: {
		input: (value) => value.toUpperCase(),
		output: (value) => value.toLowerCase(),
	},
});

export type { UserSchema, UserIdField };
export { userSchema };
