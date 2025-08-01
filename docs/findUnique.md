# Find Unique

Import the `findUnique` module to extend the query builder API with a `findUnique` method.

The only thing `findUnique()` does differently from `findFirst()` is that it
requires the `where` clause to match a primary key or unique constraint. Unfortunately, Drizzle doesn't have type-level tracking of primary keys or unique constraints, so `findUnique()` will only throw at runtime (no compile-time warnings).

```ts
// Choose your dialect
import 'drizzle-plus/pg/findUnique'
import 'drizzle-plus/mysql/findUnique'
import 'drizzle-plus/sqlite/findUnique'

// Now you can use the `findUnique` method
const result = await db.query.user.findUnique({
  where: {
    id: 42,
  },
})
// => { id: 42, name: 'Chewbacca' }
```

If no matching record is found, `findUnique()` will resolve to `undefined`.
