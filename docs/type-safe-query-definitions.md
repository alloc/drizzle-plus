# Type-safe query definitions

Import the `$findMany` module to extend the query builder API with a `$findMany` method.

The `$findMany()` method is used to define a query config for a `findMany` query in a type-safe way. If you pass two configs, it will merge them. This is useful for **Query Composition**™, which is a technique for building complex queries by composing simpler ones.

> [!NOTE]
> This method **does not** execute the query. It only returns a query config.

```ts
// Choose your dialect
import 'drizzle-plus/pg/$findMany'
import 'drizzle-plus/mysql/$findMany'
import 'drizzle-plus/sqlite/$findMany'

// Now you can use the `$findMany` method
const query = db.query.foo.$findMany({
  columns: {
    id: true,
  },
})

// The result is strongly-typed!
query.columns
//    ^? { readonly id: true }

// You can also pass two configs to merge them
const query2 = db.query.foo.$findMany(
  {
    columns: {
      id: true,
    },
  },
  {
    columns: {
      name: true,
    },
  }
)
// => {
//   columns: {
//     id: true,
//     name: true,
//   },
// }
```

When you pass two configs to `$findMany()`, it passes them to `mergeFindManyArgs()` and returns the result. Here's how the merging actually works:

- The `columns`, `with`, and `extras` properties are merged one level deep.
- The `where` property is merged using `mergeRelationsFilter()`.
- Remaining properties are merged via spread syntax (e.g. `orderBy` is replaced, not merged).
