# Single base row

> Start a select from a single placeholder row so optional left joins do not make an aggregate result disappear when every joined relation is empty.

## Enable it

```ts
import { sql } from 'drizzle-orm'
import 'drizzle-plus/pg/fromSingle'
// or 'drizzle-plus/mysql/fromSingle'
// or 'drizzle-plus/sqlite/fromSingle'
```

## Use the single-row placeholder

```ts
const summary = await db
  .select({
    total: sql<number>`count(*)`,
  })
  .fromSingle()
```

The generated base is equivalent to `(SELECT 1) AS "placeholder"`. It gives
you a guaranteed starting row that can be left-joined with other subqueries:

```ts
const summary = db.select({ total: sql<number>`count(*)` }).fromSingle()
// Add optional left joins here.
```

Use this pattern when the outer result should contain one summary row even if
every optional source has no matching data. The selection must be provided to
`db.select()` before calling `fromSingle()`.
