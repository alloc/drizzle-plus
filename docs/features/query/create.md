# Create rows with `create()`

> Insert one or more rows through `db.query.<table>.create()` and choose whether the result is a row, rows, or an insert count.

## Enable it

`create()` is currently available for PostgreSQL:

```ts
import 'drizzle-plus/pg/create'
```

It extends the relational query builder, so the table and insert values stay
inferred from your schema.

## Insert one row

With no `returning` option, the query resolves to the number of inserted rows:

```ts
const inserted = await db.query.user.create({
  data: {
    name: 'Ada Lovelace',
  },
})
// inserted: number
```

Ask for selected fields when the caller needs the inserted record:

```ts
const user = await db.query.user.create({
  data: {
    name: 'Ada Lovelace',
  },
  returning: {
    id: true,
    name: true,
  },
})
// user: { id: number; name: string }
```

`returning` can also be a function when an expression needs to reference the
table's columns:

```ts
import { upper } from 'drizzle-plus'

const user = await db.query.user.create({
  data: { name: 'Ada Lovelace' },
  returning: user => ({
    id: true,
    name: upper(user.name),
  }),
})
```

An empty `returning` object means that no row fields are returned.

## Insert many rows

Pass an array to insert several rows in one statement:

```ts
const inserted = await db.query.user.create({
  data: [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }],
  returning: { id: true },
})
// inserted: { id: number }[]
```

Set `skipDuplicates` to turn conflicts into ignored rows instead of errors:

```ts
await db.query.user.create({
  data: [{ id: 1, name: 'Ada Lovelace' }],
  skipDuplicates: true,
})
```

Use `skipDuplicates` only when ignoring the conflicting row is the intended
outcome. It does not update the existing row; for that behavior, use
[`upsert()`](upsert.md).
