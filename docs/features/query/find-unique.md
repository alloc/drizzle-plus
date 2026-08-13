# Find one row

> Find a row through a primary key or unique constraint and fail early when the filter does not identify a unique key.

## Enable it

```ts
import 'drizzle-plus/pg/findUnique'
// or 'drizzle-plus/mysql/findUnique'
// or 'drizzle-plus/sqlite/findUnique'
```

## Use a unique filter

`findUnique()` accepts the normal relational query options, but `where` is
required:

```ts
const user = await db.query.user.findUnique({
  where: {
    id: 42,
  },
  columns: {
    id: true,
    name: true,
  },
})
```

The top-level fields in `where` must match a primary key, a unique constraint,
or a unique index. If no row matches, the result is `undefined`.

## Composite keys and constraints

For a composite key, include every key column at the top level:

```ts
const item = await db.query.orderItem.findUnique({
  where: {
    orderId: 10,
    productId: 7,
  },
})
```

The current Drizzle type information does not expose all primary-key and
unique-constraint combinations to TypeScript. drizzle-plus therefore checks
the constraint at runtime.

> [!CAUTION]
> Do not hide the identifying fields inside `OR`, `AND`, or `RAW`. Those forms cannot be validated as a unique key and `findUnique()` throws `No matching primary key or unique constraint found`.
