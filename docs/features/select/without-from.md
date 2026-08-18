# Select without `FROM`

> Build a `SELECT` statement from SQL expressions alone when no table source is needed.

## Enable it

```ts
import { sql } from 'drizzle-orm'
import 'drizzle-plus/pg/withoutFrom'
// or 'drizzle-plus/mysql/withoutFrom'
// or 'drizzle-plus/sqlite/withoutFrom'
```

## Build the query

```ts
const query = db
  .select({
    answer: sql<number>`1 + 1`,
    label: sql<string>`'ready'`,
  })
  .withoutFrom()

const rows = await query
// [{ answer: 2, label: 'ready' }]
```

`withoutFrom()` emits a select with no `FROM` clause. Use SQL expressions in
the selection. To start from JavaScript literals, convert them with
[`toSelection()`](../utilities/to-selection.md) first:

```ts
import { toSelection } from 'drizzle-plus'

const query = db.select(toSelection({ answer: 1 })).withoutFrom()
```

A table column still needs a table source to be valid SQL.

The resulting builder keeps the selected-field types and can be composed with
the query-builder operations that accept a typed select query.
