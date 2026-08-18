# Coerce values with `toSQL()`

> Convert a JavaScript value or an existing SQL wrapper into a parameterized SQL expression without hand-writing a template branch for each input type.

## Use it in a helper

```ts
import { sql, type SQL } from 'drizzle-orm'
import { toSQL } from 'drizzle-plus'

function greaterThanZero(value: number | SQL<number>) {
  return sql`${toSQL(value)} > 0`
}

const expression = greaterThanZero(10)
```

Numbers, booleans, and `null` keep their corresponding SQL result types. A
value that already implements Drizzle's `SQLWrapper` interface is returned as
is, so callers can pass either a column/expression or a JavaScript value.

## Use parameter binding, not identifier construction

`toSQL()` is for values and expressions:

```ts
import 'drizzle-plus/pg/fromSingle'
// or 'drizzle-plus/mysql/fromSingle'
// or 'drizzle-plus/sqlite/fromSingle'

const query = db
  .select({
    requested: toSQL('Ada'),
  })
  .fromSingle()
```

The string is a bound value. It is not treated as a column or table name. When
you need a dynamic identifier, validate it separately and use Drizzle's
`sql.identifier()` instead.

`toSQL()` is also used internally by helpers such as `coalesce()` and
`concatWithSeparator()` to accept a mixture of values and SQL expressions.
