# Build cursor pagination with `$cursor()`

> Turn a sort order and the last row you saw into the `where` and `orderBy` options for the next relational query.

## Enable it

```ts
import 'drizzle-plus/pg/$cursor'
// or 'drizzle-plus/mysql/$cursor'
// or 'drizzle-plus/sqlite/$cursor'
```

## Build the next-page options

Pass the ordered columns first and the cursor from the previous page second:

```ts
const cursor = db.query.user.$cursor({ id: 'asc' }, { id: 99 })

const rows = await db.query.user.findMany({
  ...cursor,
  columns: {
    id: true,
    name: true,
  },
  limit: 20,
})
```

For this example, `cursor.where` is `{ id: { gt: 99 } }` and
`cursor.orderBy` is `{ id: 'asc' }`. The returned object is ready to spread
into `findMany()`, `findFirst()`, or another compatible query.

At the beginning of a list, pass `null` or `undefined`:

```ts
const firstPage = db.query.user.$cursor({ id: 'asc' }, undefined)
// firstPage.where: undefined
```

## Use more than one sort column

Property order is part of the cursor definition. All columns except the last
allow equal values; the final column advances strictly:

```ts
const cursor = db.query.user.$cursor(
  { name: 'asc', age: 'desc' },
  { name: 'John', age: 20 }
)

cursor.where
// { name: { gte: 'John' }, age: { lt: 20 } }
```

Keep the object key order the same in the query's `orderBy`, the cursor, and
the `$cursor()` call. The helper does not choose a null-ordering policy for
you; follow the behavior of your database and the ordering in your query.
