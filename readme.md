# drizzle-plus

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

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
- Added `upsert()` method to `db.query` for “create or update” operations
- Added `count()` method to `db.query` for easy counting of rows
- Added `findUnique()` method to `db.query` for efficient lookups by primary key or unique constraint
- Added `findManyAndCount()` method to `db.query` for convenient, parallel execution of `findMany()` and `count()` queries
- Added `$cursor()` method to `db.query` for type-safe, cursor-based pagination
- Nested subqueries with `nest()` helper
- `CASE…WHEN…ELSE…END` with `caseWhen()` helper
- JSON helpers like `jsonAgg()` and `jsonBuildObject()`
- Useful types via `drizzle-plus/types`
- …and more!

**Contributions are welcome!** Let's make this a great library for everyone.

> [!NOTE]
> If you like what you see, please ⭐ this repository! It really helps to attract more contributors. If you have any ❓ **questions** or 💪 **feature requests**, do not hesitate to 💬 **open an issue**.

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

### Upsert

Import the `upsert` module to extend the query builder API with a `upsert` method.

> [!WARNING]
> 🐬 **MySQL** is not supported yet.

The `upsert` method intelligently infers the correct columns to update based on the primary key and unique constraints of the table. This means you're _not_ required to manually specify a `where` clause (as you would in Prisma).

```ts
// Choose your dialect
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/sqlite/upsert'

// Now you can use the `upsert` method
const query = db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "name") values (?, ?) on conflict ("user"."id") do update set "name" = excluded."name" returning "id", "name"`,
//   params: [42, 'Chewbacca'],
// }

// Execute the query
const result = await query
// => {
//   id: 42,
//   name: 'Chewbacca',
// }
```

#### Returning clause

By default, `upsert` will return all columns of the upserted row. But you can specify a `returning` clause to return only the columns you want. Any SQL expression is allowed in the `returning` clause.

```ts
const result = await db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
  returning: {
    id: true,
    nameUpper: user => sql<string>`upper(${user.name})`,
    random: sql<number>`random()`,
  },
})
// => {
//   id: 42,
//   nameUpper: 'CHEWBACCA',
//   random: 0.123456789,
// }
```

Set `returning` to an empty object to return nothing.

#### Upserting many rows

You may pass an array of objects to the `data` property to upsert many rows at once. For optimal performance and atomicity guarantees, the rows are upserted in a single query.

```ts
const rows = await db.query.user.upsert({
  data: [
    { id: 42, name: 'Chewbacca' },
    { id: 43, name: 'Han Solo' },
  ],
})
// => [{ id: 42, name: 'Chewbacca' }, { id: 43, name: 'Han Solo' }]
```

#### Conditional updates

If a row should only be updated if it matches a certain condition, you can set the `where` option. This accepts the same object as the `where` clause of `db.query#findMany()`.

```ts
const query = db.query.user.upsert({
  data: {
    id: 42,
    handle: 'chewie',
  },
  where: {
    emailVerified: true,
  },
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "handle") values (?, ?) on conflict ("user"."id") do update set "handle" = excluded."handle" where "user"."email_verified" = true returning "id", "handle"`,
//   params: [42, 'chewie'],
// }
```

#### Updating with different data

If the data you wish to _insert_ with is different from the data you wish to
_update_ with, try setting the `update` option. This option can either be a function that receives the table as an argument, or a plain object. This feature works with both single and many upserts (e.g. when `data` is an array).

```ts
const query = db.query.user.upsert({
  data: {
    id: 42,
    loginCount: 0,
  },
  update: user => ({
    // Mutate the existing count if the row already exists.
    loginCount: sql`${user.loginCount} + 1`,
  }),
})

query.toSQL()
// => {
//   sql: `insert into "user" ("id", "login_count") values (?, ?) on conflict ("user"."id") do update set "login_count" = "user"."login_count" + 1 returning "id", "login_count"`,
//   params: [42, 0],
// }
```

#### Upserting relations

There are no plans to support Prisma’s `connect` or `connectOrCreate` features. It’s recommended to use `db.transaction()` instead.

> [!NOTE]
> Depending on the complexity of the relations, it may be possible to utilize
> _subqueries_ instead of using `db.transaction()`. Do that if you can, since it
> will avoid the round trip caused by each `await` in the transaction callback.

```ts
import 'drizzle-plus/pg/upsert'
import { nest } from 'drizzle-plus'

await db.transaction(async tx => {
  const { id } = await tx.query.user.upsert({
    data: {
      id: 42,
      name: 'Chewbacca',
    },
    returning: {
      id: true,
    },
  })
  await tx.query.friendship.upsert({
    data: {
      userId: id,
      friendId: nest(
        tx.query.user.findFirst({
          where: {
            name: 'Han Solo',
          },
          columns: {
            id: true,
          },
        })
      ),
    },
  })
})
```

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

### Find Unique

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

### Find Many and Count

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

### Cursor-Based Pagination

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

### Materialized CTEs

Import the `$withMaterialized` module to extend the query builder API with `$withMaterialized()` and `$withNotMaterialized()` methods.

These methods add `MATERIALIZED` and `NOT MATERIALIZED` keywords to the CTEs, respectively, just after the `AS` keyword. You can learn more about materialized CTEs in the [PostgreSQL docs](https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION).

> [!WARNING]
> This feature is only available in Postgres.

````ts
import 'drizzle-plus/pg/$withMaterialized'

// Same API as db.$with()
const cte1 = db.$withMaterialized(alias).as(subquery)
const cte2 = db.$withNotMaterialized(alias).as(subquery)
```

### Universal SQL functions

These functions are available in all dialects, since they're part of the SQL standard.

- **Syntax:**
  - `caseWhen`
  - `nest`
  - `toSQL`
- **SQL functions:**
  - `abs`
  - `ceil`
  - `coalesce`
  - `concatWithSeparator`
  - `currentDate`
  - `currentTime`
  - `currentTimestamp`
  - `floor`
  - `length`
  - `lower`
  - `mod`
  - `nullif`
  - `power`
  - `round`
  - `sqrt`
  - `substring`
  - `trim`
  - `upper`

Import them from the `drizzle-plus` module:

```ts
import { caseWhen } from 'drizzle-plus'
````

### Timestamps

Any `drizzle-plus` function that returns a timestamp will return a `SQLTimestamp` object, which extends the `SQL` class. Call the `toDate()` method to instruct Drizzle to parse it into a `Date` object (which is only relevant if the timestamp is used in a `select` or `returning` clause).

```ts
import { currentTimestamp } from 'drizzle-plus'

const now = currentTimestamp()
// => SQLTimestamp<string>

now.toDate()
// => SQL<Date>
```

### Dialect-specific SQL functions

These functions have differences between dialects, whether it's the name, the function signature, or its TypeScript definition relies on dialect-specific types.

- **Postgres:**
  - `concat`
  - `jsonAgg`
  - `jsonBuildObject`
  - `position`
  - `uuidv7`
  - `uuidExtractTimestamp`
- **MySQL:**
  - `concat`
  - `jsonArrayAgg`
  - `jsonObject`
  - `position`
- **SQLite:**
  - `concat`
  - `instr`
  - `jsonGroupArray`
  - `jsonObject`

```ts
// Postgres imports
import { jsonAgg } from 'drizzle-plus/pg'

// MySQL imports
import { jsonArrayAgg } from 'drizzle-plus/mysql'

// SQLite imports
import { jsonGroupArray } from 'drizzle-plus/sqlite'
```

### Utility functions

The `drizzle-plus` package also has some functions that don't produce SQL expressions, but exist for various use cases.

- `mergeFindManyArgs`
  _Combines two configs for a `findMany` query._
- `mergeRelationsFilter`
  _Combines two `where` filters for the same table._

```ts
import { mergeFindManyArgs, mergeRelationsFilter } from 'drizzle-plus'
```

### Type-safe query definitions

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

## Types

Here are some useful types that `drizzle-plus` provides:

```ts
// Universal types
import {
  InferWhereFilter,
  InferFindManyArgs,
  InferFindFirstArgs,
} from 'drizzle-plus/types'

// Pass the query builder to the type
type WhereFilter = InferWhereFilter<typeof db.query.foo>
type FindManyArgs = InferFindManyArgs<typeof db.query.foo>
type FindFirstArgs = InferFindFirstArgs<typeof db.query.foo>
```

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/drizzle-plus
[npm-downloads-src]: https://img.shields.io/npm/dm/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/drizzle-plus
[license-src]: https://img.shields.io/github/license/alloc/drizzle-plus.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/alloc/drizzle-plus/blob/main/LICENSE
