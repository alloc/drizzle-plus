# Getting started

> Install drizzle-plus, enable one dialect-aware extension, and use it with the Drizzle relational query builder you already have.

This guide assumes that you already have a Drizzle database instance with a
schema and relations. `drizzle-plus` adds methods to that instance; it does
not create the database connection or define your tables.

## Install the packages

Install `drizzle-plus` alongside a compatible v1 release of `drizzle-orm`:

```bash
pnpm add drizzle-plus drizzle-orm
```

The package declares `drizzle-orm` as a peer dependency. Keep the two packages
on compatible versions, especially when using a Drizzle release candidate.

## Enable an extension

Query extensions are activated by importing their dialect-specific module. The
import has no named value to use; it registers the method and its TypeScript
types when the module loads.

For example, to add `count()` to a PostgreSQL relational query builder:

```ts
import 'drizzle-plus/pg/count'

const total = await db.query.user.count({
  active: true,
})
// total: number
```

Import the module once from the application entrypoint, or from the module
that owns the query. Use the same dialect prefix as the Drizzle database:

| Database   | Prefix                    |
| ---------- | ------------------------- |
| PostgreSQL | `drizzle-plus/pg/...`     |
| MySQL      | `drizzle-plus/mysql/...`  |
| SQLite     | `drizzle-plus/sqlite/...` |

## Import SQL helpers

Helpers shared by all three databases come from `drizzle-plus`:

```ts
import { upper } from 'drizzle-plus'

const rows = await db.query.user.findMany({
  extras: {
    displayName: user => upper(user.name),
  },
})
```

Dialect-specific helpers come from a dialect subpath:

```ts
import { jsonAgg } from 'drizzle-plus/pg'
```

The [feature pages](index.md#features) show the smallest import and example
for each capability.

## Check dialect support before choosing a feature

Most extensions are available for every supported dialect. These two have
explicit limits:

| Feature                                            | PostgreSQL | MySQL | SQLite |
| -------------------------------------------------- | ---------- | ----- | ------ |
| `create()`                                         | Yes        | No    | No     |
| `upsert()`                                         | Yes        | No    | Yes    |
| `$withMaterialized()` and `$withNotMaterialized()` | Yes        | No    | No     |
| `updateMany({ returning })`                        | Yes        | No    | Yes    |

The remaining query and select extensions are generated for PostgreSQL, MySQL,
and SQLite. A page that uses a side-effect import always shows the exact
supported path.

## A small end-to-end example

Once the extension is imported, use it as part of an ordinary Drizzle query:

```ts
import 'drizzle-plus/sqlite/findManyAndCount'

const page = await db.query.user.findManyAndCount({
  where: { active: true },
  columns: {
    id: true,
    name: true,
  },
  limit: 20,
})

page.data // the current page
page.count // the total matching row count
```

Move to the page for the feature you need next. Start with the [query
extensions](features/query/count.md) for relational queries, or the [SQL
building blocks](features/sql/universal-functions.md) for expressions inside
`select`, `where`, `extras`, and `returning` clauses.
