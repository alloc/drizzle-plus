# drizzle-plus

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

> Focused query-builder extensions and SQL helpers for Drizzle ORM.

`drizzle-plus` adds practical query methods such as `count()`, `upsert()`,
`updateMany()`, and cursor pagination. It also provides typed SQL expressions
for common functions, JSON aggregation, timestamps, subqueries, and more.

It supports PostgreSQL, MySQL, and SQLite. The [documentation](docs/index.md)
has one page for each extension and helper family, with the supported import
path and a working starting example.

## Install

```bash
pnpm add drizzle-plus drizzle-orm
```

The package targets the Drizzle ORM v1 line and declares `drizzle-orm` as a
peer dependency. Keep both packages on compatible versions.

## First extension

Query extensions are enabled with a dialect-specific side-effect import:

```ts
import 'drizzle-plus/sqlite/findManyAndCount'

const page = await db.query.user.findManyAndCount({
  where: { active: true },
  columns: { id: true, name: true },
  limit: 20,
})

page.data
page.count
```

Use `pg`, `mysql`, or `sqlite` in the import path that matches your Drizzle
database. Shared SQL helpers are named imports:

```ts
import { caseWhen, upper } from 'drizzle-plus'
import { jsonAgg } from 'drizzle-plus/pg'
```

## Feature map

### Query extensions

- [Create rows](docs/features/query/create.md)
- [Upsert rows](docs/features/query/upsert.md)
- [Update many rows](docs/features/query/update-many.md)
- [Count rows](docs/features/query/count.md)
- [Find a unique row](docs/features/query/find-unique.md)
- [Find many and count](docs/features/query/find-many-and-count.md)
- [Cursor pagination](docs/features/query/cursor-pagination.md)
- [Query composition](docs/features/query/query-composition.md)

### Database and select helpers

- [Build selections with `$select()`](docs/features/select/select.md)
- [Build `VALUES` relations with `$values()`](docs/features/select/values.md)
- [Use queries as subqueries with `.as()`](docs/features/select/aliases.md)
- [Build recursive CTEs](docs/features/select/recursive-ctes.md)
- [Control PostgreSQL CTE materialization](docs/features/select/materialized-ctes.md)
- [Omit table columns with `$without()`](docs/features/select/without-columns.md)
- [Keep one base row with `fromSingle()`](docs/features/select/from-single.md)
- [Select expressions without `FROM`](docs/features/select/without-from.md)

### SQL helpers and utilities

- [Conditional expressions](docs/features/sql/case-when.md)
- [Scalar subqueries](docs/features/sql/nested-subqueries.md)
- [SQL value coercion](docs/features/sql/to-sql.md)
- [Universal SQL functions](docs/features/sql/universal-functions.md)
- [Dialect-specific SQL functions](docs/features/sql/dialect-functions.md)
- [Database timestamps](docs/features/sql/timestamps.md)
- [Require a result with `orThrow()`](docs/features/utilities/or-throw.md)
- [Merge query options](docs/features/utilities/merge-queries.md)
- [Convert plain values with `toSelection()`](docs/features/utilities/to-selection.md)
- [Derived types](docs/features/utilities/types.md)

## Development

```bash
pnpm test
pnpm run lint
pnpm run docs:build
```

Contributions are welcome. See the [full documentation](docs/index.md) for
feature boundaries and dialect support.

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/drizzle-plus
[npm-downloads-src]: https://img.shields.io/npm/dm/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/drizzle-plus
[license-src]: https://img.shields.io/github/license/alloc/drizzle-plus.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/alloc/drizzle-plus/blob/main/LICENSE
