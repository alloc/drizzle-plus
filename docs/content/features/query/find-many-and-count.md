# Fetch a page and its total with `findManyAndCount()`

> Run a `findMany()` query and a matching count together, returning page data and the total number of matching rows in one result.

## Enable it

```ts
import 'drizzle-plus/pg/findManyAndCount'
// or 'drizzle-plus/mysql/findManyAndCount'
// or 'drizzle-plus/sqlite/findManyAndCount'
```

## Return page data and the unpaged total

The options match `findMany()`. `limit` and `offset` affect `data`, but not
`count`:

```ts
const page = await db.query.user.findManyAndCount({
  where: {
    active: true,
  },
  columns: {
    id: true,
    name: true,
  },
  orderBy: { id: 'desc' },
  limit: 20,
  offset: 40,
})

page.data // the third page of rows
page.count // every active row, ignoring limit and offset
```

The count uses the same `where` filter as the list query. It does not include
the list's `limit` or `offset`.

## Inspect both statements

Before execution, `toSQL()` returns both generated queries:

```ts
const query = db.query.user.findManyAndCount({
  where: { active: true },
  limit: 20,
})

query.toSQL().findMany
query.toSQL().count
```

The implementation starts the two operations in parallel. A database session
that does not allow parallel work may serialize them instead.
