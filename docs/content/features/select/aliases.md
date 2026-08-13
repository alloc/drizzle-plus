# Use queries as named subqueries with `.as()`

> Give a select or relational query a name so its selected fields can be referenced from another query with type-safe aliases.

## Enable it

```ts
import { eq } from 'drizzle-orm'
import 'drizzle-plus/pg/as'
// or 'drizzle-plus/mysql/as'
// or 'drizzle-plus/sqlite/as'
```

## Alias a select query

Select the fields first, then call `.as(alias)`:

```ts
const activeUsers = db
  .select({
    id: user.id,
    name: user.name,
  })
  .from(user)
  .where(eq(user.active, true))
  .as('active_users')

const rows = await db
  .select({ id: activeUsers.id, name: activeUsers.name })
  .from(activeUsers)
```

The alias becomes the table name in the outer SQL query, and the selected field
decoders are carried into the outer result.

## Alias a relational query

Relational queries can be used the same way:

```ts
const recentUsers = db.query.user
  .findMany({
    columns: {
      id: true,
      name: true,
    },
    limit: 10,
  })
  .as('recent_users')

const rows = await db
  .select({ id: recentUsers.id, name: recentUsers.name })
  .from(recentUsers)
```

The source query must have a selection. An unselected `db.select()` cannot be
aliased because there are no fields to expose.

The [`$values()`](values.md) helper also exposes `.as()` for its generated
columns, and [upsert](../query/upsert.md) can expose its returned fields as a
subquery when it is composed into a larger statement.
