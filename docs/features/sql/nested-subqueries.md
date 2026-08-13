# Scalar subqueries

> Wrap a one-column select or relational query in parentheses and preserve its Drizzle result decoder when it becomes a scalar SQL expression.

## Nest a relational query

```ts
import { desc, sql } from 'drizzle-orm'
import { nest } from 'drizzle-plus'
import 'drizzle-plus/sqlite/count'
import 'drizzle-plus/sqlite/fromSingle'

const userCount = nest(db.query.user.count())

const rows = await db
  .select({
    label: sql<string>`'users'`,
    total: userCount,
  })
  .fromSingle()
```

The resulting SQL contains `(select count(*) ...)`, and the count decoder is
used when the outer query returns the value.

## Nest a select query

`nest()` also accepts a regular select query:

```ts
const latestName = nest(
  db.select({ name: user.name }).from(user).orderBy(desc(user.id)).limit(1)
)
```

## Keep the subquery scalar

The input must expose exactly one selected column. If it selects zero columns
or multiple columns, `nest()` throws `Subquery must have exactly one column`.
The query may still return no row; in that case the scalar result can be
`null`, so handle that case in the outer expression when it matters.
