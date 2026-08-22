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

## Documentation

- [Getting started](docs/getting-started.md) — install the package and enable an extension.
- [Full documentation](docs/index.md) — task-oriented guides for every feature.

## Development

```bash
pnpm test
pnpm run lint
pnpm run docs:build
```

Contributions are welcome. See the [full documentation](docs/index.md) for
feature boundaries and dialect support.

## Agent reference

The [agent reference](docs/agent-reference.md) is a complete, non-tutorial
inventory of the package's query extensions, select helpers, SQL functions,
utilities, types, and dialect boundaries. Use it to find the relevant guide
before choosing an API.

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/drizzle-plus
[npm-downloads-src]: https://img.shields.io/npm/dm/drizzle-plus?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/drizzle-plus
[license-src]: https://img.shields.io/github/license/alloc/drizzle-plus.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/alloc/drizzle-plus/blob/main/LICENSE
