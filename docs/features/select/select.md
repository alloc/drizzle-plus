# Build selections with `$select()`

> Convert a plain JavaScript object into a selection that `db.select()` can use while preserving aliases and result types.

## Enable it

```ts
import 'drizzle-plus/pg/$select'
// or 'drizzle-plus/mysql/$select'
// or 'drizzle-plus/sqlite/$select'
```

## Select values and expressions

`db.$select()` accepts an object whose values can be columns, SQL expressions,
primitive values, dates, subqueries, or JSON-serializable objects:

```ts
const selection = db.$select({
  id: user.id,
  label: 'active user',
  isVisible: true,
  metadata: { source: 'admin' },
})

const rows = await db.select(selection).from(user)
```

The object keys become the result keys. Primitive values are bound as SQL
parameters, and each value is aliased so the selection remains stable when it
is passed to `db.select()`.

`undefined` properties are skipped. `Date` values are represented as ISO
strings, and other objects must be JSON-serializable. Functions are rejected;
use a SQL expression when the database should compute a value.

## Use `toSelection()` directly

The same conversion is available as a standalone helper:

```ts
import { toSelection } from 'drizzle-plus'

const selection = toSelection({
  id: user.id,
  label: 'active user',
})
```

Use `db.$select()` when you want the database-bound helper. Use `toSelection()`
when a reusable utility or library function should accept a plain object first.
