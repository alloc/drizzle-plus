# Convert plain values with `toSelection()`

> Turn a record of columns, expressions, and JSON-safe values into a Drizzle select selection without requiring a database helper instance.

## Build a reusable selection

```ts
import { toSelection } from 'drizzle-plus'

const selection = toSelection({
  id: user.id,
  displayName: 'anonymous',
  settings: { compact: true },
})

const rows = await db.select(selection).from(user)
```

The object keys become aliases in the selection. `undefined` values are
ignored, primitive values are parameterized, dates become ISO strings, and SQL
wrappers or columns are preserved.

Use the optional `addAliases` flag when a caller needs aliases added to the
generated SQL explicitly:

```ts
const selection = toSelection(
  { id: user.id, label: 'anonymous' },
  { addAliases: true }
)
```

`db.$select()` is the database-bound convenience form of this helper. See
[`$select()`](../select/select.md) when you already have `db` available.
