# Cursor-Based Pagination

Import the `$cursor` module to extend the query builder API with a `$cursor` method.

With `$cursor()`, you get the peace of mind knowing that TypeScript will catch any errors in your cursor-based pagination. No more forgotten `orderBy` clauses, mismatched cursor objects, or manually-written `where` clauses.

Just give it your desired sort order and the cursor object, and it will generate the correct `where` clause.

```ts
// Step 1: Choose your dialect
import 'drizzle-plus/pg/$cursor'
import 'drizzle-plus/mysql/$cursor'
import 'drizzle-plus/sqlite/$cursor'

// Step 2: Use the `$cursor` method
const cursorParams = db.query.foo.$cursor({ id: 'asc' }, { id: 99 })
// => {
//   where: { id: { gt: 99 } },
//   orderBy: { id: 'asc' },
// }

// Step 3: Add the cursor parameters to your query
const results = await db.query.foo.findMany({
  ...cursorParams,
  columns: {
    id: true,
    name: true,
    age: true,
  },
})
```

- **Arguments:**
  - The first argument is the “order by” clause. This is used to determine the comparison operator for each column, and it's returned with the generated `where` filter. **Property order is important.**
  - The second argument is the user-provided cursor object. It can be `null` or `undefined` to indicate the start of the query.
- **Returns:** The query parameters that you should include in your query. You can spread them into the options passed to `findMany()`, `findFirst()`, etc.

#### Cursors with multiple columns

In addition to type safety and auto-completion, another nice thing about `$cursor()` is its support for multiple columns.

```ts
const cursorParams = db.query.user.$cursor(
  { name: 'asc', age: 'desc' },
  { name: 'John', age: 20 }
)

cursorParams.where
// => { name: { gte: 'John' }, age: { lt: 20 } }

cursorParams.orderBy
// => { name: 'asc', age: 'desc' }
```

> [!NOTE]
> The order of keys in the first argument to `$cursor()` is **important**, as it helps in determining the comparison operator for each column. All except the last key allow rows with equal values (`gte` or `lte`), while the last key is always either `gt` (for ascending order) or `lt` (for descending order).

Also of note, as of June 28 2025, Drizzle doesn't yet provide control over treatment of `NULL` values when using the Relational Query Builder (RQB) API. While this library _could_ implement it ourselves (at least, for the `$cursor` method), we'd prefer to wait for Drizzle to provide a proper solution.
