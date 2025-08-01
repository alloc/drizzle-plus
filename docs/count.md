# Count

Import the `count` module to extend the query builder API with a `count` method.

```ts
// Choose your dialect
import 'drizzle-plus/pg/count'
import 'drizzle-plus/mysql/count'
import 'drizzle-plus/sqlite/count'

// Now you can use the `count` method
const count = db.query.foo.count()
//    ^? Promise<number>

// Pass filters to the `count` method
const countWithFilter = db.query.foo.count({
  id: { gt: 100 },
})

// Inspect the SQL:
console.log(countWithFilter.toSQL())
// {
//   sql: `select count(*) from "foo" where "foo"."id" > 100`,
//   params: [],
// }

// Execute the query
const result = await countWithFilter
// => 0
```
