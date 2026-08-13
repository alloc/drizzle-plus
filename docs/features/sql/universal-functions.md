# Universal SQL functions

> Call common SQL functions through typed helpers that work across PostgreSQL, MySQL, and SQLite.

Import these functions from the root package:

```ts
import { coalesce, lower, round } from 'drizzle-plus'
```

They accept compatible columns, SQL expressions, and values as described by
their signatures, so they can be used in `select`, `extras`, `where`, and
`returning` selections.

## Text functions

| Function                                    | Result                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `concatWithSeparator(separator, ...values)` | Concatenates values with a separator; null values are skipped unless the separator is null. |
| `length(value)`                             | String length.                                                                              |
| `lower(value)`                              | Lowercase string.                                                                           |
| `substring(value, start, length?)`          | A 1-based substring; without a length, runs to the end.                                     |
| `trim(value)`                               | Removes leading and trailing spaces.                                                        |
| `upper(value)`                              | Uppercase string.                                                                           |

Example:

```ts
const rows = await db.query.user.findMany({
  extras: {
    normalizedName: user => lower(trim(user.name)),
  },
})
```

## Numeric functions

| Function                  | Result                                               |
| ------------------------- | ---------------------------------------------------- |
| `abs(value)`              | Absolute value.                                      |
| `ceil(value)`             | Smallest integer greater than or equal to the value. |
| `floor(value)`            | Largest integer less than or equal to the value.     |
| `mod(dividend, divisor)`  | Remainder after division.                            |
| `power(base, exponent)`   | Base raised to an exponent.                          |
| `round(value, decimals?)` | Rounded value, to the nearest integer by default.    |
| `sqrt(value)`             | Square root.                                         |

## Null and current-time functions

| Function                | Result                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| `coalesce(...values)`   | The first non-null value.                                        |
| `nullif(first, second)` | `NULL` when the two values are equal; otherwise the first value. |
| `currentDate()`         | Current date; see [timestamps](timestamps.md).                   |
| `currentTime()`         | Current time without a date component.                           |
| `currentTimestamp()`    | Current date and time; see [timestamps](timestamps.md).          |

SQL `NULL` behavior still comes from the database. If a column is nullable,
the helper's result type keeps that possibility where the function's inputs
allow it.
