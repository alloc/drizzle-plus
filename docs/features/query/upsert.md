# Upsert rows with `upsert()`

> Insert a row when its conflict key is new, or update the existing row when that key already exists.

## Enable it

`upsert()` is generated for PostgreSQL and SQLite:

```ts
import 'drizzle-plus/pg/upsert'
// or
import 'drizzle-plus/sqlite/upsert'
```

MySQL is not supported by this extension.

## The basic operation

When the inserted data contains a primary key or unique column, drizzle-plus
uses that constraint as the conflict target:

```ts
const user = await db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
})
// user: the full upserted row
```

For a single object, the result is one row. For an array, the result is an
array in the same operation:

```ts
const users = await db.query.user.upsert({
  data: [
    { id: 42, name: 'Chewbacca' },
    { id: 43, name: 'Han Solo' },
  ],
  returning: {
    id: true,
    name: true,
  },
})
// users: { id: number; name: string }[]
```

## Choose the conflict target

By default, the target is inferred from the columns defined in the first row
of `data`. Use `target` when the row contains more than one possible key or
when a different unique constraint should decide the conflict:

```ts
await db.query.user.upsert({
  data: {
    id: 43,
    handle: 'chewie',
  },
  target: ['handle'],
})
```

The target must name a primary key, unique constraint, or unique index that
exists on the table. If no matching constraint can be found, the query throws
before it is executed.

## Return only the fields you need

`returning` accepts a selection object or a function that receives the table
columns. SQL expressions are allowed in the selection:

```ts
import { upper } from 'drizzle-plus'

const user = await db.query.user.upsert({
  data: { id: 42, name: 'Chewbacca' },
  returning: user => ({
    id: true,
    nameUpper: upper(user.name),
  }),
})
```

If `returning` is omitted, all columns are returned. An empty object asks the
database for no returned fields.

## Update with different data

Use `update` when the values to insert are not the values to write on a
conflict. The callback receives `current` columns from the existing row and
`excluded` columns from the incoming row:

```ts
import { sql } from 'drizzle-orm'

const user = await db.query.user.upsert({
  data: {
    id: 42,
    loginCount: 0,
  },
  update: ({ current }) => ({
    loginCount: sql`${current.loginCount} + 1`,
  }),
})
```

To reuse incoming values, read them from `excluded`:

```ts
await db.query.user.upsert({
  data: { id: 42, name: 'Chewie' },
  update: ({ excluded }) => ({
    name: excluded.name,
  }),
  updateWhere: {
    // Only update a matching row when this condition is true.
    emailVerified: true,
  },
})
```

`updateWhere` limits the update part of the operation. It does not change how
the conflict target is selected.

## Insert from a query

For many-row upserts, `data` can also be an insert-select query or a compatible
subquery. This is useful when the incoming rows already live in the database;
see [aliases](../select/aliases.md) for the subquery shape.
