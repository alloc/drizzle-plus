# Update many rows with `updateMany()`

> Update multiple rows through the relational query builder, with filters, ordering, limits, and typed returned rows where the dialect supports them.

## Enable it

```ts
import 'drizzle-plus/pg/updateMany'
// or 'drizzle-plus/mysql/updateMany'
// or 'drizzle-plus/sqlite/updateMany'
```

## Update matching rows

`set` is required. `where` uses the same relation-aware filter shape as
`findMany()`:

```ts
const updated = await db.query.user.updateMany({
  set: {
    active: true,
  },
  where: {
    lastSeenAt: { isNotNull: true },
  },
})
// updated: number
```

Use a callback when the new value references the row being updated:

```ts
import { sql } from 'drizzle-orm'

await db.query.user.updateMany({
  set: user => ({
    loginCount: sql`${user.loginCount} + 1`,
  }),
  where: { active: true },
})
```

## Limit which rows are updated

`limit` caps the number of rows, and `orderBy` decides which rows are selected
when the limit is smaller than the match set:

```ts
await db.query.user.updateMany({
  set: { active: false },
  where: { lastSeenAt: { isNull: true } },
  orderBy: { id: 'asc' },
  limit: 100,
})
```

Without `orderBy`, the database may choose any matching rows.

## Return updated rows

On PostgreSQL and SQLite, use `returning` to receive an array of selected
fields instead of a count:

```ts
const users = await db.query.user.updateMany({
  set: { active: false },
  where: { lastSeenAt: { isNull: true } },
  returning: {
    id: true,
    active: true,
  },
})
// users: { id: number; active: boolean }[]
```

`returning` can be a function, and SQL expressions are allowed in the result.
Leave it undefined or pass `{}` to receive the number of updated rows.

> [!WARNING]
> MySQL does not support `returning` for this extension. The MySQL type does not accept that option; use the returned count or run a separate select when the updated rows are needed.
