# Compose `findMany()` options with `$findMany()`

> Build reusable, type-checked relational query configs without executing a query until you pass the config to `findMany()`.

## Enable it

```ts
import 'drizzle-plus/pg/$findMany'
// or 'drizzle-plus/mysql/$findMany'
// or 'drizzle-plus/sqlite/$findMany'
```

## Define a reusable config

`$findMany()` returns its argument unchanged. It is useful when the type of a
config should be checked against a particular table before the query is
assembled:

```ts
const visibleUsers = db.query.user.$findMany({
  where: { active: true },
  columns: {
    id: true,
    name: true,
  },
})

const rows = await db.query.user.findMany(visibleUsers)
```

The call does not contact the database.

## Merge two configs

Pass a base config and an override config to merge them:

```ts
const base = db.query.user.$findMany({
  where: { active: true },
  columns: { id: true },
})

const page = db.query.user.$findMany(base, {
  columns: { name: true },
  limit: 20,
})

const rows = await db.query.user.findMany(page)
```

`columns`, `with`, and `extras` are merged one level deep. `where` is combined
by [`mergeRelationsFilter()`](../utilities/merge-queries.md); properties such
as `limit`, `offset`, and `orderBy` use the later config when both are present.
