# Update Many

Import the `updateMany` module to extend the query builder API with a `updateMany` method.

The `updateMany` method has the following options:

- `set`: **(required)** The columns to update. May be a function or a plain object.
- `where`: A filter to only update rows that match the filter. Same API as `findMany()`.
- `orderBy`: The order of the rows to update. Same API as `findMany()`.
- `limit`: The maximum number of rows to update.
- `returning`: The columns to return. Same API as `upsert()` above.

```ts
// Choose your dialect
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/sqlite/updateMany'

// Now you can use the `updateMany` method
const query = db.query.user.updateMany({
  // Pass a function to reference the updated row, or pass a plain object.
  set: user => ({
    name: sql`upper(${user.name})`,
  }),
  where: {
    name: 'Jeff',
  },
})

query.toSQL()
// => {
//   sql: `update "user" set "name" = upper("user"."name") where "user"."name" = ?`,
//   params: ['Jeff'],
// }
```

If the `returning` option is undefined or an empty object, the query will return the number of rows updated. Otherwise, an array of objects will be returned.
