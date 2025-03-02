# ID Generation System Usage

This document demonstrates how to use the custom ID generation system for C15T database tables.

## Table-Level ID Generation

The ID generation is now handled at the table level rather than at the field level. This makes it easier to maintain consistent ID generation across entities.

### Basic Usage

When defining a table schema, include the `entityPrefix` and use the `defaultIdGenerator`:

```typescript
import { defaultIdGenerator } from '~/db/core/fields';

export function getExampleTable(options, customFields) {
  return {
    // Table name
    entityName: options.example?.entityName || 'example',
    
    // Entity prefix for IDs - this will be used in generated IDs
    entityPrefix: options.example?.entityPrefix || 'exm',
    
    // ID generator that automatically uses entityPrefix
    generateId: defaultIdGenerator, // Will generate 'exm_...' IDs
    
    // Fields - note no ID field is needed
    fields: {
      name: {
        type: 'string',
        required: true,
      },
      // ... other fields
    }
  };
}
```

### Configurable Prefixes

By using options to configure the prefix, you allow users to customize the ID format:

```typescript
// User configuration
const config = {
  example: {
    entityPrefix: 'custom',
  }
};

// In your code
const tableSchema = getExampleTable(config);
// This will use 'custom_...' as the ID prefix
```

### Explicit ID Generator

If you need more control over ID generation, you can use `createIdGenerator` with a specific prefix:

```typescript
import { createIdGenerator } from '~/db/core/fields';

export function getExampleTable(options, customFields) {
  // Get the prefix from options or use a default
  const prefix = options.example?.entityPrefix || 'exm';
  
  return {
    entityName: options.example?.entityName || 'example',
    entityPrefix: prefix,
    
    // Create a custom generator with the prefix
    generateId: createIdGenerator(prefix),
    
    fields: {
      // ... fields
    }
  };
}
```

## Manual ID Generation

If you need to generate IDs manually (not in a table schema):

```typescript
import { generateId, createIdGenerator } from '~/db/core/fields';

// Generate ID directly
const recordId = generateId('rec'); // 'rec_3hK4G...'

// Create a reusable generator
const generateUserId = createIdGenerator('usr');
const newUserId = generateUserId(); // 'usr_5RtX9...'
```

## Benefits of This Approach

1. **Consistent ID format** across all entities
2. **No duplicate definitions** - entity prefixes are defined only in tables
3. **Configurable prefixes** - can be specified through configuration
4. **Time-ordered IDs** to help with sorting and indexing
5. **Human-readable prefixes** for easier debugging
6. **Table-level ID generation** keeps ID logic out of the fields 