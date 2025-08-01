# Find Many and Count

Import the `findManyAndCount` module to extend the query builder API with a `findManyAndCount` method.

The `findManyAndCount` method accepts the same arguments as `findMany()`, and returns an object with `data` and `count` properties. The count is the total number of rows that would be returned by the `findMany` query, without any `limit` or `offset` applied.

```ts
// Choose your dialect
import 'drizzle-plus/pg/findManyAndCount'
import 'drizzle-plus/mysql/findManyAndCount'
import 'drizzle-plus/sqlite/findManyAndCount'

// Now you can use the `findManyAndCount` method
const { data, count } = await db.query.foo.findManyAndCount({
  where: {
    age: { gt: 20 },
  },
  limit: 2,
  columns: {
    id: true,
    name: true,
    age: true,
  },
})
// => {
//   data: [
//     { id: 1, name: 'Alice', age: 25 },
//     { id: 2, name: 'Bob', age: 30 },
//   ],
//   count: 10,
// }
```

The two queries (`findMany` and `count`) are executed in parallel.

> [!WARNING]
> Your database connection _may not_ support parallel queries, in which case this method will execute the queries sequentially.
