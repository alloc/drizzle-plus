# Dialect-specific functions

> Use the database's native function names through a dialect subpath while keeping selected results decoded by Drizzle.

Choose the import path that matches the database that will execute the query:

```ts
import { jsonAgg, jsonBuildObject } from 'drizzle-plus/pg'
// import { jsonArrayAgg, jsonObject } from 'drizzle-plus/mysql'
// import { jsonGroupArray, jsonObject } from 'drizzle-plus/sqlite'
```

## Function availability

| Dialect    | Functions                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL | `cast`, `concat`, `jsonAgg`, `jsonAggNotNull`, `jsonBuildObject`, `position`, `rowToJson`, `uuidExtractTimestamp`, `uuidv7` |
| MySQL      | `cast`, `concat`, `jsonArrayAgg`, `jsonObject`, `position`                                                                  |
| SQLite     | `cast`, `concat`, `instr`, `jsonGroupArray`, `jsonObject`                                                                   |

## JSON aggregation and objects

Aggregate a selected value into a JSON array:

```ts
import { jsonAgg, jsonAggNotNull } from 'drizzle-plus/pg'

const values = db
  .select({
    tags: jsonAgg(user.name),
    tagsOrEmpty: jsonAggNotNull(user.name),
  })
  .from(user)
```

PostgreSQL's `jsonAgg()` returns `null` for an empty input. Use
`jsonAggNotNull()` when an empty JSON array is the desired result. MySQL's
`jsonArrayAgg()` and SQLite's `jsonGroupArray()` provide the corresponding
dialect-native array aggregation.

`jsonBuildObject()` (PostgreSQL) and `jsonObject()` (MySQL/SQLite) can build a
JSON object from a selected subquery or from a plain object of SQL values:

```ts
import { jsonObject } from 'drizzle-plus/sqlite'

const summary = jsonObject({
  id: user.id,
  name: user.name,
})
```

## Strings and positions

`concat()` has database-specific null behavior. PostgreSQL and SQLite treat a
null argument as an empty string; MySQL returns null when an argument is null.
PostgreSQL's and SQLite's `concat()` functions accept the same value shape, but
they still come from their respective subpaths.

`position(substring, string)` returns a 1-based match position in PostgreSQL
and MySQL. PostgreSQL performs a case-sensitive search. MySQL follows the
collation rules of its arguments, which may be case-sensitive or
case-insensitive. SQLite exposes `instr(string, substring)` instead, with the
arguments in that order; its search is case-sensitive.

## Casts and PostgreSQL UUID helpers

`cast(value, type)` produces a native `CAST` expression and infers common
JavaScript result types from known dialect type names:

```ts
import { cast } from 'drizzle-plus/pg'

const numericId = cast(user.id, 'int8')
```

PostgreSQL also provides `uuidv7(shift?)`, which creates a time-ordered UUID,
and `uuidExtractTimestamp(uuid)`, which returns an SQL timestamp expression.
`rowToJson()` converts one row to a JSON object; use `jsonAgg(rowToJson(...))`
when the source can contain multiple rows.

> [!WARNING]
> The `type` argument to `cast()` is inserted as a raw SQL type name. Never pass user input there unless it has been validated against an allowlist.
