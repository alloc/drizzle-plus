# Select expressions without `FROM`

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

`withoutFrom()` emits a select with no `FROM` clause. Use SQL expressions or
literal values in the selection; a table column still needs a table source to
be valid SQL.

The resulting builder keeps the selected-field types and can be composed with
the query-builder operations that accept a typed select query.
