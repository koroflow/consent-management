# Advanced JSON and Date Handling in C15T

C15T provides intelligent, database-specific handling for JSON data and date/time values to ensure maximum compatibility and performance across different database systems. This document explains how data is stored and accessed in different database environments.

## SuperJSON Integration

C15T uses [SuperJSON](https://github.com/blitz-js/superjson) to enhance JSON serialization for complex JavaScript types that aren't natively supported by JSON, such as:

- `Date` objects with timezone information
- JavaScript `Map` and `Set` objects
- `BigInt` values
- `undefined` values
- Custom class instances
- And more

## Database-Specific Behavior

### PostgreSQL

PostgreSQL has excellent native support for both JSON and timestamps with timezone:

- **JSON fields**: Uses native JSONB type for most JSON data, with SuperJSON only applied when needed for complex JS types
- **Date fields**: Uses native TIMESTAMPTZ which properly preserves timezone information
- **Benefits**: Offers high performance and the ability to perform JSON path queries directly in the database

### MySQL

MySQL has native JSON support but more limited date/timezone handling:

- **JSON fields**: Uses native JSON type with SuperJSON selectively applied for complex types
- **Date fields**: Uses consistent timezone handling to ensure predictable behavior
- **Benefits**: Provides good balance between native database features and JavaScript type support

### SQLite

SQLite has no native JSON or timezone-aware date types:

- **JSON fields**: Always uses SuperJSON format stored as TEXT to preserve all JavaScript types
- **Date fields**: Uses special handling to maintain timezone information
- **Benefits**: Maintains complete JavaScript data structures even with SQLite's simpler type system

## Implications for Your Application

### Accessing Data Outside C15T

When accessing data stored by C15T from outside the library (e.g., direct database queries), be aware:

- **PostgreSQL data**: Most fields can be accessed directly without special handling
- **MySQL data**: Complex values might be in SuperJSON format (look for `{"json":..., "meta":...}` structure)
- **SQLite data**: All JSON and date fields will be in SuperJSON format and require parsing

To parse SuperJSON data outside of C15T:

```javascript
// If using SuperJSON
const data = superjson.parse(valueFromDatabase);

// Without SuperJSON, you can manually extract the data
const parsed = JSON.parse(valueFromDatabase);
const actualData = parsed.json; // The actual data is in the 'json' property
```

### Best Practices

1. **Use C15T's API** when possible to abstract away database differences
2. **Document data format** if you expect other systems to access the database directly
3. **Consider database requirements** when designing systems that need to use multiple database types
4. **Test across databases** if your application needs to support multiple database types

## Configuration

The database-specific handling is applied automatically based on your database configuration when you initialize C15T.

If needed, you can manually set the database type:

```typescript
import { setDatabaseType } from '@c15t/backend/db/core/fields/superjson-utils';

// Must be called before using any field operations
setDatabaseType('sqlite'); // or 'postgresql', 'mysql'
```

## Extending SuperJSON

If you need to support additional custom types with SuperJSON, you can register them:

```typescript
import superjson from 'superjson';

// Register a custom type
superjson.registerCustom<MyCustomType, string>(
  // isMyType check
  (v) => v instanceof MyCustomType,
  // serialize
  (v) => v.toString(),
  // deserialize
  (v) => new MyCustomType(v)
);
``` 