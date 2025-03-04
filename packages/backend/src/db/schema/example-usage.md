# ID Generation and Table Configuration

This document demonstrates how to use the custom ID generation system and table configuration in the C15T system.

## Table-Level ID Generation

The ID generation is now handled at the table level rather than at the field level. This makes it easier to maintain consistent ID generation across entities.

### Basic Usage

When defining a table schema, include the `entityPrefix` and use the `defaultIdGenerator`:

```typescript
import { defaultIdGenerator } from '~/db/core/fields';

export function getExampleTable(options, customFields) {
  // Get config with backward compatibility
  const exampleConfig = options.tables?.example || options.example;

  return {
    // Table name
    entityName: exampleConfig?.entityName || 'example',
    
    // Entity prefix for IDs - this will be used in generated IDs
    entityPrefix: exampleConfig?.entityPrefix || 'exm',
    
    // ID generator that automatically uses entityPrefix
    generateId: defaultIdGenerator, // Will generate 'exm_...' IDs
    
    // Fields - note no ID field is needed
    fields: {
      name: {
        type: 'string',
        required: true,
        fieldName: exampleConfig?.fields?.name || 'name',
      },
      // ... other fields
    }
  };
}
```

## Configuration Structure

The C15T system uses a standardized approach to entity configuration with two key improvements:

1. **Typed Entity Configurations** - Each entity has its own typed configuration interface
2. **Centralized Tables Object** - All tables are organized under a single `tables` object

```typescript
// In options.ts
export interface BaseEntityConfig {
  // Basic entity properties
  entityName?: string;
  entityPrefix?: string;
  fields?: Record<string, string>;
  additionalFields?: Record<string, Field>;
}

// Specific entity config with typed fields
export interface UserEntityConfig extends BaseEntityConfig {
  fields?: Record<string, string> & {
    email?: string;
    isIdentified?: string;
    // ...etc
  };
}

// Tables configuration that collects all entity configs
export interface TablesConfig {
  user?: UserEntityConfig;
  record?: RecordEntityConfig;
  // ... other entities
}

// Main options with tables object
export interface C15TOptions {
  // ...other options
  
  // All database tables in one place
  tables?: TablesConfig;
}
```

### Using the Tables Configuration

The recommended way to configure tables is through the `tables` object:

```typescript
// User configuration with tables object
const config: C15TOptions = {
  appName: 'My Consent System',
  
  // All table configuration in one place
  tables: {
    // User table configuration
    user: {
      entityName: 'customer',
      entityPrefix: 'cst',
      fields: {
        email: 'emailAddress'
      }
    },
    
    // Record table configuration
    record: {
      entityPrefix: 'log'
    }
  }
};
```

### Backward Compatibility

For backward compatibility, you can still use the top-level configuration, but it's recommended to migrate to the tables object:

```typescript
// Legacy configuration (still supported but deprecated)
const legacyConfig: C15TOptions = {
  user: {
    entityPrefix: 'usr',
    // ...
  },
  record: {
    entityPrefix: 'rec',
    // ...
  }
};
```

When implementing table schemas, support both approaches:

```typescript
export function getTable(options) {
  // Support both new and legacy paths
  const config = options.tables?.example || options.example;
  
  // Use the config...
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
7. **Standardized entity configuration** - reduces code duplication and inconsistencies
8. **Organized configuration** - all table configurations in one place
9. **Type safety** - specific entity types for better editor support 