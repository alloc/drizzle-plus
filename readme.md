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

- All features are optional and 🌴 tree-shakable.
- Support for 🐘 **Postgres**, 🐬 **MySQL**, and 🪶 **SQLite**
- Added `upsert()` method to `db.query` for “create or update” operations
- Added `updateMany()` method to `db.query` for updating many rows at once
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

```ts
// Choose your dialect
import 'drizzle-plus/pg/upsert'

const query = db.query.user.upsert({
  data: {
    id: 42,
    name: 'Chewbacca',
  },
})

const result = await query
// => { id: 42, name: 'Chewbacca' }
```

Equivalent SQL:

```sql
insert into "user" ("id", "name") values (42, 'Chewbacca') on conflict ("user"."id") do update set "name" = excluded."name" returning "id", "name"
```

- [`Returning clause`](docs/upsert.md#returning-clause): Specify which columns to return after an upsert operation.
- [`Upserting many rows`](docs/upsert.md#upserting-many-rows): Upsert multiple rows in a single, atomic query.
- [`Conditional updates`](docs/upsert.md#conditional-updates): Apply updates only if a row matches a specific condition.
- [`Updating with different data`](docs/upsert.md#updating-with-different-data): Use different data for insert and update operations.
- [`Upserting relations`](docs/upsert.md#upserting-relations): Guidance on handling related data with transactions.

For more details, see the [Upsert documentation](docs/upsert.md).

### Update Many

Import the `updateMany` module to extend the query builder API with a `updateMany` method.

```ts
// Choose your dialect
import 'drizzle-plus/pg/updateMany'

const query = db.query.user.updateMany({
  set: user => ({
    name: sql`upper(${user.name})`,
  }),
  where: {
    name: 'Jeff',
  },
})

const result = await query
// => { affectedRows: 1 } (for MySQL/SQLite) or [{ id: ..., name: ... }] (for Postgres with returning)
```

Equivalent SQL:

```sql
update "user" set "name" = upper("user"."name") where "user"."name" = 'Jeff'
```

For more details, see the [Update Many documentation](docs/updateMany.md).

### Count

Import the `count` module to extend the query builder API with a `count` method.

```ts
// Choose your dialect
import 'drizzle-plus/pg/count'

const countWithFilter = db.query.foo.count({
  id: { gt: 100 },
})

const result = await countWithFilter
// => 0
```

Equivalent SQL:

```sql
select count(*) from "foo" where "foo"."id" > 100
```

For more details, see the [Count documentation](docs/count.md).

### Find Unique

Import the `findUnique` module to extend the query builder API with a `findUnique` method.

```ts
// Choose your dialect
import 'drizzle-plus/pg/findUnique'

const result = await db.query.user.findUnique({
  where: {
    id: 42,
  },
})
// => { id: 42, name: 'Chewbacca' }
```

Equivalent SQL:

```sql
select * from "user" where "user"."id" = 42 limit 1
```

For more details, see the [Find Unique documentation](docs/findUnique.md).

### Find Many and Count

Import the `findManyAndCount` module to extend the query builder API with a `findManyAndCount` method.

```ts
// Choose your dialect
import 'drizzle-plus/pg/findManyAndCount'

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
```

Equivalent SQL (simplified for example, actual execution involves two parallel queries):

```sql
select "id", "name", "age" from "foo" where "age" > 20 limit 2;
select count(*) from "foo" where "age" > 20;
```

For more details, see the [Find Many and Count documentation](docs/findManyAndCount.md).

### Cursor-Based Pagination

Import the `$cursor` module to extend the query builder API with a `$cursor` method.

```ts
// Step 1: Choose your dialect
import 'drizzle-plus/pg/$cursor'

// Step 2: Use the `$cursor` method
const cursorParams = db.query.foo.$cursor({ id: 'asc' }, { id: 99 })

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

Equivalent SQL (for the generated `where` clause):

```sql
select "id", "name", "age" from "foo" where "id" > 99 order by "id" asc
```

- [`Cursors with multiple columns`](docs/cursor-based-pagination.md#cursors-with-multiple-columns): How to use cursor-based pagination with multiple sort columns.

For more details, see the [Cursor-Based Pagination documentation](docs/cursor-based-pagination.md).

### Materialized CTEs

Import the `$withMaterialized` module to extend the query builder API with `$withMaterialized()` and `$withNotMaterialized()` methods.

```ts
import 'drizzle-plus/pg/$withMaterialized'
import { sql } from 'drizzle-orm'

const alias = sql`my_cte`
const subquery = sql`select 1 as value`

const result = await db.select().from(cte1)
// => [{ value: 1 }]
```

Equivalent SQL:

```sql
WITH my_cte AS MATERIALIZED (select 1 as value)
SELECT * FROM my_cte;
```

For more details, see the [Materialized CTEs documentation](docs/materialized-ctes.md).

### Universal SQL Functions

These functions are available in all dialects, since they're part of the SQL standard. Here's an example using `caseWhen`:

```ts
import { caseWhen, sql } from 'drizzle-orm'

const result = await db
  .select({
    status: caseWhen(
      sql`column_value > 10`,
      'High',
      sql`column_value > 5`,
      'Medium',
      'Low'
    ),
  })
  .from(myTable)
```

Equivalent SQL:

```sql
SELECT CASE WHEN column_value > 10 THEN 'High' WHEN column_value > 5 THEN 'Medium' ELSE 'Low' END AS status FROM my_table;
```

Other universal SQL functions:

- [`nest`](docs/universal-sql-functions.md#syntax): Embed subqueries directly within your main query.
- [`toSQL`](docs/universal-sql-functions.md#syntax): Inspect the generated SQL query and its parameters.
- [`abs`](docs/universal-sql-functions.md#sql-functions): Returns the absolute value of a number.
- [`ceil`](docs/universal-sql-functions.md#sql-functions): Returns the smallest integer greater than or equal to a number.
- [`coalesce`](docs/universal-sql-functions.md#sql-functions): Returns the first non-null expression among its arguments.
- [`concatWithSeparator`](docs/universal-sql-functions.md#sql-functions): Concatenates two or more strings with a specified separator.
- [`currentDate`](docs/universal-sql-functions.md#sql-functions): Returns the current date.
- [`currentTime`](docs/universal-sql-functions.md#sql-functions): Returns the current time.
- [`currentTimestamp`](docs/universal-sql-functions.md#sql-functions): Returns the current timestamp.
- [`floor`](docs/universal-sql-functions.md#sql-functions): Returns the largest integer less than or equal to a number.
- [`length`](docs/universal-sql-functions.md#sql-functions): Returns the length of a string.
- [`lower`](docs/universal-sql-functions.md#sql-functions): Converts a string to lowercase.
- [`mod`](docs/universal-sql-functions.md#sql-functions): Returns the remainder of a division.
- [`nullif`](docs/universal-sql-functions.md#sql-functions): Returns null if two expressions are equal, otherwise returns the first expression.
- [`power`](docs/universal-sql-functions.md#sql-functions): Returns the value of a number raised to the power of another number.
- [`round`](docs/universal-sql-functions.md#sql-functions): Rounds a number to a specified number of decimal places.
- [`sqrt`](docs/universal-sql-functions.md#sql-functions): Returns the square root of a number.
- [`substring`](docs/universal-sql-functions.md#sql-functions): Extracts a substring from a string.
- [`trim`](docs/universal-sql-functions.md#sql-functions): Removes leading and trailing spaces (or other specified characters) from a string.
- [`upper`](docs/universal-sql-functions.md#sql-functions): Converts a string to uppercase.

For more details, see the [Universal SQL Functions documentation](docs/universal-sql-functions.md).

### Dialect-Specific SQL Functions

These functions have differences between dialects, whether it's the name, the function signature, or its TypeScript definition relies on dialect-specific types. Here's an example for Postgres `jsonAgg`:

```ts
// Postgres imports
import { jsonAgg } from 'drizzle-plus/pg'
import { sql } from 'drizzle-orm'

const result = await db
  .select({
    data: jsonAgg(sql`users.name`),
  })
  .from(users)
```

Equivalent SQL (Postgres):

```sql
SELECT json_agg(users.name) AS data FROM users;
```

Other dialect-specific SQL functions:

- **Postgres:**
  - `concat`: Concatenates two or more strings.
  - `jsonBuildObject`: Builds a JSON object from a variadic argument list.
  - `position`: Returns the starting position of the first occurrence of a substring within a string.
  - `uuidv7`: Generates a UUID v7.
  - `uuidExtractTimestamp`: Extracts the timestamp from a UUID.
- **MySQL:**
  - `concat`: Concatenates two or more strings.
  - `jsonArrayAgg`: Aggregates JSON values as a JSON array.
  - `jsonObject`: Creates a JSON object.
  - `position`: Returns the starting position of the first occurrence of a substring within a string.
- **SQLite:**
  - `concat`: Concatenates two or more strings.
  - `instr`: Returns the starting position of the first occurrence of a substring within a string.
  - `jsonGroupArray`: Aggregates JSON values as a JSON array.
  - `jsonObject`: Creates a JSON object.

For more details, see the [Dialect-Specific SQL Functions documentation](docs/dialect-specific-sql-functions.md).

### Further Documentation

- [Timestamps](docs/timestamps.md)
- [Utility Functions](docs/utility-functions.md)
- [Type-Safe Query Definitions](docs/type-safe-query-definitions.md)
- [Types](docs/types.md)

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/drizzle-plus
[npm-downloads-src]: https://img.shields.io/npm/dm/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/drizzle-plus
[license-src]: https://img.shields.io/github/license/alloc/drizzle-plus.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/alloc/drizzle-plus/blob/main/LICENSE
