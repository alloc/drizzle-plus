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
- Added `count` method to Relational Query Builder API
- Nested subqueries with `nest()` helper
- `CASE…WHEN…ELSE…END` with `caseWhen()` helper
- Literal values with `literal()` helper
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
// Import your dialect
import 'drizzle-plus/pg/count'

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

### Everything else

The other functions are pretty self-explanatory. More documentation will be added in the future.

## License

MIT
