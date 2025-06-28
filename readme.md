# drizzle-plus

A collection of useful utilities and extensions for Drizzle ORM.

> [!WARNING]
> This package only works with Drizzle v1.0.0 or later.
>
> That means you need `drizzle-orm@beta` installed.
>
> ```bash
> pnpm add drizzle-orm@beta
> ```

#### Highlights

- Support for 🐘 **Postgres**, 🐬 **MySQL**, and 🪶 **SQLite**
- Added `count()` method to `db.query` for easy counting of rows
- Added `$cursor()` method to `db.query` for type-safe, cursor-based pagination
- Nested subqueries with `nest()` helper
- `CASE…WHEN…ELSE…END` with `caseWhen()` helper
- Literal values with `literal()` helper
- JSON helpers like `jsonAgg()` and `toJsonObject()`
- Useful types via `drizzle-plus/types`

**Contributions are welcome!** Let's make this a great library for everyone.

## Installation

- **PNPM**
  ```bash
  pnpm add drizzle-plus
  ```
- **Yarn**
  ```bash
  yarn add drizzle-plus
  ```
- **NPM**
  ```bash
  npm install drizzle-plus
  ```

## Usage

### Count

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
// equivalent to:
//   select count(*) from "foo" where "foo"."id" > 100

// Inspect the SQL:
console.log(count.toSQL())
// {
//   sql: `select count(*) from "foo"`,
//   params: [],
// }
```

### Cursor

Import the `cursor` module to extend the query builder API with a `$cursor` method.

With `$cursor()`, you get the peace of mind knowing that TypeScript will catch any errors in your cursor-based pagination. No more forgotten `orderBy` clauses or incorrect cursor objects.

Just give it your desired sort order and the cursor object, and it will generate the correct `where` clause.

```ts
// Step 1: Choose your dialect
import 'drizzle-plus/pg/cursor'
import 'drizzle-plus/mysql/cursor'
import 'drizzle-plus/sqlite/cursor'

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

### Other Functions

```ts
// Universal imports
import { caseWhen, literal, nest } from 'drizzle-plus'

// Postgres imports
import { jsonAgg, toJsonObject } from 'drizzle-plus/pg'

// MySQL imports
import { jsonArrayAgg, toJsonObject } from 'drizzle-plus/mysql'

// SQLite imports
import { jsonGroupArray, toJsonObject } from 'drizzle-plus/sqlite'
```

(More documentation will be added in the future.)

## Types

Here are some useful types that `drizzle-plus` provides:

```ts
// Dialect-specific types
import {
  InferWhereFilter,
  InferFindManyArgs,
  InferFindFirstArgs,
} from 'drizzle-plus/pg/types'

// Pass the query builder to the type
type WhereFilter = InferWhereFilter<typeof db.query.foo>
type FindManyArgs = InferFindManyArgs<typeof db.query.foo>
type FindFirstArgs = InferFindFirstArgs<typeof db.query.foo>
```

## License

MIT
