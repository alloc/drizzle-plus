# drizzle-plus

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

> Focused query-builder extensions and SQL helpers for Drizzle ORM.

`drizzle-plus` adds practical query methods such as `count()`, `upsert()`,
`updateMany()`, and cursor pagination. It also provides typed SQL expressions
for common functions, JSON aggregation, timestamps, subqueries, and more.

It supports PostgreSQL, MySQL, and SQLite. The [documentation](docs/content/index.md)
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

- [Create rows](docs/content/features/query/create.md)
- [Upsert rows](docs/content/features/query/upsert.md)
- [Update many rows](docs/content/features/query/update-many.md)
- [Count rows](docs/content/features/query/count.md)
- [Find a unique row](docs/content/features/query/find-unique.md)
- [Find many and count](docs/content/features/query/find-many-and-count.md)
- [Cursor pagination](docs/content/features/query/cursor-pagination.md)
- [Query composition](docs/content/features/query/query-composition.md)

### Database and select helpers

- [Build selections with `$select()`](docs/content/features/select/select.md)
- [Build `VALUES` relations with `$values()`](docs/content/features/select/values.md)
- [Use queries as subqueries with `.as()`](docs/content/features/select/aliases.md)
- [Build recursive CTEs](docs/content/features/select/recursive-ctes.md)
- [Control PostgreSQL CTE materialization](docs/content/features/select/materialized-ctes.md)
- [Omit table columns with `$without()`](docs/content/features/select/without-columns.md)
- [Keep one base row with `fromSingle()`](docs/content/features/select/from-single.md)
- [Select expressions without `FROM`](docs/content/features/select/without-from.md)

### SQL helpers and utilities

- [Conditional expressions](docs/content/features/sql/case-when.md)
- [Scalar subqueries](docs/content/features/sql/nested-subqueries.md)
- [SQL value coercion](docs/content/features/sql/to-sql.md)
- [Universal SQL functions](docs/content/features/sql/universal-functions.md)
- [Dialect-specific SQL functions](docs/content/features/sql/dialect-functions.md)
- [Database timestamps](docs/content/features/sql/timestamps.md)
- [Require a result with `orThrow()`](docs/content/features/utilities/or-throw.md)
- [Merge query options](docs/content/features/utilities/merge-queries.md)
- [Convert plain values with `toSelection()`](docs/content/features/utilities/to-selection.md)
- [Derived types](docs/content/features/utilities/types.md)

## Development

```bash
pnpm test
pnpm run lint
pnpm run docs:build
```

Contributions are welcome. See the [full documentation](docs/content/index.md) for
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
