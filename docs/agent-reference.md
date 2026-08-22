# Agent reference

> Identify the capability you need, then follow its linked guide; this page is an inventory, not a tutorial.

Use this page to recognize what `drizzle-plus` can add to an existing Drizzle
ORM application. The linked feature pages own setup, options, result behavior,
dialect caveats, and examples. Assume a Drizzle database instance with a schema
and relations already exists.

## Dialect boundaries

Most query and select extensions are available for all three dialects. These
are the intentional exceptions:

| Capability                                       | PostgreSQL | MySQL | SQLite |
| ------------------------------------------------ | ---------- | ----- | ------ |
| `create()`                                       | Yes        | No    | No     |
| `upsert()`                                       | Yes        | No    | Yes    |
| `$withMaterialized()` / `$withNotMaterialized()` | Yes        | No    | No     |
| `updateMany({ returning })`                      | Yes        | No    | Yes    |

MySQL's `updateMany()` type does not accept `returning`. The feature guides
state any additional runtime constraints next to the affected capability.

## Query-builder extensions

These methods extend `db.query.<table>`; they do not create a database
connection or change the schema.

| Capability           | What it signals                                                                              | Guide                                                    |
| -------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `$cursor()`          | Derive the next-page `where` and `orderBy` from an ordered cursor.                           | [Cursor pagination](features/query/cursor-pagination.md) |
| `$findMany()`        | Type-check, reuse, and merge `findMany()` configs without executing a query.                 | [Query composition](features/query/query-composition.md) |
| `count()`            | Count all or relation-filtered rows.                                                         | [Count rows](features/query/count.md)                    |
| `create()`           | Insert one or many rows, optionally skip duplicates, and optionally return fields.           | [Create rows](features/query/create.md)                  |
| `findUnique()`       | Require a primary-key or unique-constraint filter when finding one row.                      | [Find one row](features/query/find-unique.md)            |
| `findManyAndCount()` | Return page data and the unpaged count for the same filter.                                  | [Page and count](features/query/find-many-and-count.md)  |
| `updateMany()`       | Update filtered rows with optional ordering, limit, and dialect-supported returning.         | [Bulk updates](features/query/update-many.md)            |
| `upsert()`           | Insert on a new conflict key or update the existing row, with target and returning controls. | [Upsert rows](features/query/upsert.md)                  |

## Database, table, and select-builder extensions

| Capability                                             | What it signals                                                                                          | Guide                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `db.$select()`                                         | Convert columns, expressions, primitive values, subqueries, and JSON-safe values into a typed selection. | [Selections with `$select()`](features/select/select.md)    |
| `db.$values()` / `db.$withValues()`                    | Represent in-memory rows as a typed `VALUES` relation or CTE.                                            | [`VALUES` relations](features/select/values.md)             |
| `.as(alias)`                                           | Name a select or relational query and expose its selected fields to an outer query.                      | [Named subqueries](features/select/aliases.md)              |
| `db.$withRecursive()`                                  | Build a `WITH RECURSIVE` CTE whose callback can reference the CTE being defined.                         | [Recursive CTEs](features/select/recursive-ctes.md)         |
| `db.$withMaterialized()` / `db.$withNotMaterialized()` | Override PostgreSQL CTE materialization or inlining.                                                     | [CTE materialization](features/select/materialized-ctes.md) |
| `table.$without()`                                     | Derive a table-column selection while omitting named columns.                                            | [Omit columns](features/select/without-columns.md)          |
| `.fromSingle()`                                        | Start a select from one placeholder row when no table source should remove the result.                   | [Single base row](features/select/from-single.md)           |
| `.withoutFrom()`                                       | Build a select from expressions without a `FROM` clause.                                                 | [Select without `FROM`](features/select/without-from.md)    |

## SQL expressions and functions

### Shared syntax helpers

| Export       | What it signals                                                                         | Guide                                                  |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `caseWhen()` | Build a typed, incremental SQL `CASE` expression; optional conditions can be skipped.   | [`caseWhen()` expressions](features/sql/case-when.md)  |
| `nest()`     | Turn a one-column select or relational query into a decoder-preserving scalar subquery. | [Scalar subqueries](features/sql/nested-subqueries.md) |
| `toSQL()`    | Coerce a JavaScript value or SQL wrapper into a typed, parameterized SQL expression.    | [Coerce values with `toSQL()`](features/sql/to-sql.md) |

### Universal SQL functions

These functions work across PostgreSQL, MySQL, and SQLite:

| Family            | Exports                                                                            | Guide                                                          |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Text              | `concatWithSeparator()`, `length()`, `lower()`, `substring()`, `trim()`, `upper()` | [Universal SQL functions](features/sql/universal-functions.md) |
| Numeric           | `abs()`, `ceil()`, `floor()`, `mod()`, `power()`, `round()`, `sqrt()`              | [Universal SQL functions](features/sql/universal-functions.md) |
| Null/current time | `coalesce()`, `nullif()`, `currentDate()`, `currentTime()`, `currentTimestamp()`   | [Universal SQL functions](features/sql/universal-functions.md) |
| Date decoding     | `SQLTimestamp`, `.toDate()` on timestamp expressions                               | [Timestamps as `Date`](features/sql/timestamps.md)             |

### Dialect-specific SQL functions

The dialect function guide owns the database-specific null behavior,
argument order, result decoding, and cast safety rules.

| Dialect    | Exports                                                                                                                                       | Guide                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| PostgreSQL | `cast()`, `concat()`, `jsonAgg()`, `jsonAggNotNull()`, `jsonBuildObject()`, `position()`, `rowToJson()`, `uuidExtractTimestamp()`, `uuidv7()` | [Dialect-specific functions](features/sql/dialect-functions.md) |
| MySQL      | `cast()`, `concat()`, `jsonArrayAgg()`, `jsonObject()`, `position()`                                                                          | [Dialect-specific functions](features/sql/dialect-functions.md) |
| SQLite     | `cast()`, `concat()`, `instr()`, `jsonGroupArray()`, `jsonObject()`                                                                           | [Dialect-specific functions](features/sql/dialect-functions.md) |

## Utilities and type contracts

| Capability                 | What it signals                                                                                                 | Guide                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `orThrow()`                | Reject an empty query result and narrow the awaited result to a non-null value.                                 | [Throw on empty results](features/utilities/or-throw.md)              |
| `mergeFindManyArgs()`      | Merge reusable relational query options, including one-level `columns`, `with`, `extras`, and relation filters. | [Merge query options](features/utilities/merge-queries.md)            |
| `mergeRelationsFilter()`   | Combine compatible relational `where` filters.                                                                  | [Merge query options](features/utilities/merge-queries.md)            |
| `toSelection()`            | Convert a reusable record of columns, SQL expressions, and JSON-safe values into a selection.                   | [Selections with `toSelection()`](features/utilities/to-selection.md) |
| Relational query inference | Derive `findMany`/`findFirst` args, relation filters, relations, and ordering from a table query builder.       | [Relational query types](features/utilities/types.md)                 |
| SQL/query result inference | Describe SQL inputs, nullability, query results, scalar subqueries, returning fields, and insert/update values. | [Relational query types](features/utilities/types.md)                 |
| JSON value contracts       | Constrain values accepted as JSON-serializable selection or object input.                                       | [Selections with `$select()`](features/select/select.md)              |

Advanced integrations can also use low-level helpers for selected fields, SQL
and dialect extraction, relational query building, decoder preservation, JSON
object/array decoding, and selected-field ordering. Prefer the documented
feature APIs when they cover the use case.
