# Count rows with `count()`

> Get a numeric row count from a relational query builder, with the same filter shape used by `findMany()`.

## Enable it

```ts
import 'drizzle-plus/pg/count'
// or 'drizzle-plus/mysql/count'
// or 'drizzle-plus/sqlite/count'
```

## Count all or filtered rows

Call `count()` with no argument for the whole table, or pass a relation-aware
filter for matching rows:

```ts
const allUsers = await db.query.user.count()

const activeUsers = await db.query.user.count({
  active: true,
})
```

Both values are numbers. Relation filters are supported too:

```ts
const usersWithEmail = await db.query.user.count({
  emails: true,
})
```

## Inspect or nest the query

`count()` returns a query promise, so you can inspect its SQL before executing
it:

```ts
const query = db.query.user.count({
  active: true,
})

console.log(query.toSQL())
const total = await query
```

To use the count as a scalar expression inside another query, wrap it with
[`nest()`](../sql/nested-subqueries.md). That helper preserves the numeric
decoder.
