# Using neverthrow in c15t

## Overview

The c15t library now supports a functional approach to error handling using the [neverthrow](https://github.com/supermacro/neverthrow) library. This approach provides several benefits:

- More explicit error handling with the `Result` type
- Better type safety and compile-time checks for error cases
- Ability to chain operations with proper error propagation
- No need for try/catch blocks or exception handling
- Clearer and more predictable code flow

This document explains how to use the neverthrow `Result` pattern with c15t.

## Basic Concepts

The core concept of neverthrow is the `Result` type, which represents either:

- A successful operation (`Ok` variant) containing a value, or
- A failed operation (`Err` variant) containing an error

Instead of throwing exceptions, functions return a `Result` that must be handled explicitly.

### Result vs Traditional Error Handling

Traditional approach:
```typescript
try {
  const context = await init(options);
  // Use context...
} catch (error) {
  // Handle errors...
}
```

neverthrow approach:
```typescript
const contextResult = await init(options);
contextResult.match({
  ok: (context) => {
    // Use context...
  },
  err: (error) => {
    // Handle errors...
  }
});
```

## Using c15t with neverthrow

### Initialization

The c15t library provides two versions of most core functions:

1. Traditional functions that might throw exceptions (for backward compatibility)
2. New functions with the `WithResult` suffix that return `Result` objects

```typescript
import { c15tWithResult } from '@c15t/backend';
import { memoryAdapter } from '@c15t/backend/db/adapters/memory';

// Create a c15t instance with Result-based error handling
const c15tInstance = c15tWithResult({
  secret: 'your-secret-key',
  storage: memoryAdapter(),
});

// The context is now a ResultAsync
c15tInstance.$context.match({
  ok: (context) => {
    console.log(`Initialized ${context.appName} successfully`);
  },
  err: (error) => {
    console.error(`Initialization failed: ${error.message}`);
  }
});
```

### Request Handling

The Result-based instance provides both traditional and Result-based handlers:

```typescript
// Traditional approach (might throw)
app.use('/api/c15t', async (req, res) => {
  try {
    const response = await c15tInstance.handler(request);
    // Handle response...
  } catch (error) {
    // Handle error...
  }
});

// Result-based approach
app.use('/api/c15t', async (req, res) => {
  const requestResult = await c15tInstance.handlerWithResult(request);
  
  requestResult.match({
    ok: (response) => {
      // Handle successful response...
    },
    err: (error) => {
      // Handle error with structured data...
    }
  });
});
```

### Error Types

All errors are instances of `C15TError` with properties:

- `message`: Human-readable error message
- `code`: Error code from `BASE_ERROR_CODES`
- `status`: HTTP status code when applicable
- `data`: Additional error data

### Chaining Operations

One of the major benefits of the neverthrow approach is the ability to chain operations with proper error handling:

```typescript
c15tInstance.$context
  .andThen(context => {
    // Use context to perform another operation
    return c15tInstance.handlerWithResult(request);
  })
  .map(response => {
    // Transform successful response
    return response.json();
  })
  .mapErr(error => {
    // Transform or enrich error
    console.error(`Error: ${error.message}`);
    return error;
  });
```

### Combining with Promises

You can convert between Results and Promises:

```typescript
import { toPromise, fromC15TPromise } from '@c15t/backend/utils';

// Convert Result to Promise (might throw)
const contextPromise = toPromise(c15tInstance.$context);

// Convert Promise to Result
const resultFromPromise = fromC15TPromise(somePromise);
```

## Complete Example

See the complete example at `packages/c15t/src/examples/neverthrow-example.ts`.

## Best Practices

1. **Be explicit about errors**: Use the `match` method to handle both success and error cases explicitly.

2. **Chain operations**: Use `andThen`, `map`, and `mapErr` to chain operations and transformations.

3. **Type your errors**: Make use of error codes to handle specific error conditions.

4. **Avoid mixing patterns**: Stick to either the Result pattern or traditional try/catch within a single function.

5. **Convert at boundaries**: Use conversion utilities when interacting with code that doesn't use the Result pattern.

## Backward Compatibility

The c15t library maintains backward compatibility with the traditional error handling approach. You can continue using the existing API, or gradually migrate to the Result pattern. 