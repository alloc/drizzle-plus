# Drizzle ORM RC upstream bug: aliased subqueries need column lists

> Record the upstream behavior that `$values().as(alias)` depends on, so maintainers can distinguish a drizzle-plus feature issue from a Drizzle ORM renderer issue.

Status: the local `drizzle-orm` patch has been removed. This document captures the
behavior that drizzle-plus still needs from upstream.

## Affected versions

- `drizzle-orm@1.0.0-rc.4` (the `rc` tag when this was documented)
- `drizzle-kit@1.0.0-rc.4` is upgraded alongside it, but is not the source of
  this bug

## Affected drizzle-plus feature

The affected public feature is `$values`, specifically `ValuesList.as(alias)`
when the resulting subquery is used as a table source or joined as a table.
The implementation exists in the shared extension source and in the generated
Postgres, MySQL, and SQLite entrypoints:

- [`src/extensions/$values.ts`](https://github.com/alloc/drizzle-plus/blob/main/src/extensions/$values.ts)
- [`src/generated/pg/$values.ts`](https://github.com/alloc/drizzle-plus/blob/main/src/generated/pg/$values.ts)
- [`src/generated/mysql/$values.ts`](https://github.com/alloc/drizzle-plus/blob/main/src/generated/mysql/$values.ts)
- [`src/generated/sqlite/$values.ts`](https://github.com/alloc/drizzle-plus/blob/main/src/generated/sqlite/$values.ts)

`ValuesList.as()` exposes fields using the caller's object keys, while SQL
identifiers must use the dialect-converted column names. It therefore computes
`columnList` and passes it to Drizzle's `Subquery` constructor:

```ts
const columnList = this.keys.map(key => this.casing.convert(key))

new Subquery(this.getSQL(), selectedFields, alias, false, [], columnList)
```

The local patch made Drizzle preserve that list and emit it after a normal
subquery alias. Without that behavior, the sixth constructor argument is
ignored at runtime and the generated fields refer to names that the `VALUES`
relation does not expose.

```mermaid
flowchart LR
  A["$values(rows)"] --> B["ValuesList.as(alias)"]
  B --> C["Subquery + columnList"]
  C --> D["Drizzle subquery renderer"]
  D --> E["FROM (VALUES ...) \"alias\" (\"columns\")"]
  F["$withValues(...)"] --> G["drizzle-plus buildWithCTE"]
  G --> H["CTE column-list syntax"]
```

`$withValues()` is not the direct consumer of the patched constructor path:
drizzle-plus already renders its CTE column list in `buildWithCTE`. The other
`as()` helpers for select and relational queries do not provide a column list.

## Minimal reproduction

This reproduction uses only Drizzle ORM and does not require a database:

```ts
import { Subquery, sql } from 'drizzle-orm'
import { SQLiteDialect } from 'drizzle-orm/sqlite-core'

const subquery = new Subquery(sql`values (${1})`, {}, 'v', false, [], ['id'])

const query = new SQLiteDialect().sqlToQuery(sql`select * from ${subquery}`)
console.log(query)
```

With `drizzle-orm@1.0.0-rc.4` and no local patch, the result is:

```text
{ sql: 'select * from (values (?)) "v"', params: [1] }
```

The required result is:

```text
{ sql: 'select * from (values (?)) "v" ("id")', params: [1] }
```

The missing alias column list means a query that selects `v.id` cannot resolve
the requested field. The issue is especially visible when object keys are
converted by a dialect casing strategy, because the subquery must expose the
converted identifiers while drizzle-plus preserves the original keys in its
typed selection.

The RC declaration also rejects the sixth constructor argument at compile
time, so the same gap is both a runtime SQL bug and a missing public type
contract.

## Requested upstream change

Drizzle ORM should support an optional column list for ordinary aliased
subqueries:

1. Add `columnList?: string[]` to `Subquery._` and to the `Subquery` constructor
   type declaration.
2. Store the value on the subquery instance.
3. In the SQL renderer's non-CTE `Subquery` branch, append an escaped identifier
   list after the alias when `columnList` is present:

   ```sql
   (subquery_sql) "alias" ("column_a", "column_b")
   ```

4. Leave CTE handling unchanged; CTEs have their own `WITH alias (columns) AS`
   syntax and drizzle-plus currently renders that syntax itself.
5. Add a regression test that verifies both the SQL and identifier escaping,
   plus the existing output when `columnList` is omitted.

The implementation should use Drizzle's identifier escaping and should not add
the column-list clause for `WithSubquery` instances unless that is explicitly
part of the CTE API.
