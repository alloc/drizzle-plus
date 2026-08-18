# Agent reference

> Identify the capability you need, then follow its linked guide; this page is an inventory, not a tutorial.

Use this page to recognize what `drizzle-plus` can add to an existing Drizzle
ORM application. The linked feature pages own setup, options, result behavior,
dialect caveats, and examples. Assume a Drizzle database instance with a schema
and relations already exists.

## Package shape

- `drizzle-plus` — shared query utilities, SQL syntax, and universal SQL functions.
- `drizzle-plus/<dialect>` — named SQL helpers for `pg`, `mysql`, or `sqlite`.
- `drizzle-plus/<dialect>/<extension>` — dialect-specific side-effect imports
  that install query, database, table, or select-builder extensions.
- `drizzle-plus/types` — types derived from relational query builders and SQL
  expressions.
- `drizzle-plus/types/json` — JSON-serializable value types.
- `drizzle-plus/utils` — advanced query, decoder, and selection plumbing.

A `<dialect>` placeholder below means `pg`, `mysql`, or `sqlite`. Import an
extension with the same prefix as the database that will execute the query.

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

These imports augment `db.query.<table>`; they do not create a database
connection or change the schema.

| Capability           | Activation                                               | What it signals                                                                              | Guide                                                    |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `$cursor()`          | `drizzle-plus/<dialect>/$cursor`                         | Derive the next-page `where` and `orderBy` from an ordered cursor.                           | [Cursor pagination](features/query/cursor-pagination.md) |
| `$findMany()`        | `drizzle-plus/<dialect>/$findMany`                       | Type-check, reuse, and merge `findMany()` configs without executing a query.                 | [Query composition](features/query/query-composition.md) |
| `count()`            | `drizzle-plus/<dialect>/count`                           | Count all or relation-filtered rows.                                                         | [Count rows](features/query/count.md)                    |
| `create()`           | `drizzle-plus/pg/create`                                 | Insert one or many rows, optionally skip duplicates, and optionally return fields.           | [Create rows](features/query/create.md)                  |
| `findUnique()`       | `drizzle-plus/<dialect>/findUnique`                      | Require a primary-key or unique-constraint filter when finding one row.                      | [Find one row](features/query/find-unique.md)            |
| `findManyAndCount()` | `drizzle-plus/<dialect>/findManyAndCount`                | Return page data and the unpaged count for the same filter.                                  | [Page and count](features/query/find-many-and-count.md)  |
| `updateMany()`       | `drizzle-plus/<dialect>/updateMany`                      | Update filtered rows with optional ordering, limit, and dialect-supported returning.         | [Bulk updates](features/query/update-many.md)            |
| `upsert()`           | `drizzle-plus/pg/upsert` or `drizzle-plus/sqlite/upsert` | Insert on a new conflict key or update the existing row, with target and returning controls. | [Upsert rows](features/query/upsert.md)                  |

## Database, table, and select-builder extensions

| Capability                                             | Activation                              | What it signals                                                                                          | Guide                                                       |
| ------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `db.$select()`                                         | `drizzle-plus/<dialect>/$select`        | Convert columns, expressions, primitive values, subqueries, and JSON-safe values into a typed selection. | [Selections with `$select()`](features/select/select.md)    |
| `db.$values()` / `db.$withValues()`                    | `drizzle-plus/<dialect>/$values`        | Represent in-memory rows as a typed `VALUES` relation or CTE.                                            | [`VALUES` relations](features/select/values.md)             |
| `.as(alias)`                                           | `drizzle-plus/<dialect>/as`             | Name a select or relational query and expose its selected fields to an outer query.                      | [Named subqueries](features/select/aliases.md)              |
| `db.$withRecursive()`                                  | `drizzle-plus/<dialect>/$withRecursive` | Build a `WITH RECURSIVE` CTE whose callback can reference the CTE being defined.                         | [Recursive CTEs](features/select/recursive-ctes.md)         |
| `db.$withMaterialized()` / `db.$withNotMaterialized()` | `drizzle-plus/pg/$withMaterialized`     | Override PostgreSQL CTE materialization or inlining.                                                     | [CTE materialization](features/select/materialized-ctes.md) |
| `table.$without()`                                     | `drizzle-plus/<dialect>/$without`       | Derive a table-column selection while omitting named columns.                                            | [Omit columns](features/select/without-columns.md)          |
| `.fromSingle()`                                        | `drizzle-plus/<dialect>/fromSingle`     | Start a select from one placeholder row when no table source should remove the result.                   | [Single base row](features/select/from-single.md)           |
| `.withoutFrom()`                                       | `drizzle-plus/<dialect>/withoutFrom`    | Build a select from expressions without a `FROM` clause.                                                 | [Select without `FROM`](features/select/without-from.md)    |

## SQL expressions and functions

### Shared syntax helpers

Import these from `drizzle-plus`:

| Export       | What it signals                                                                         | Guide                                                  |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `caseWhen()` | Build a typed, incremental SQL `CASE` expression; optional conditions can be skipped.   | [`caseWhen()` expressions](features/sql/case-when.md)  |
| `nest()`     | Turn a one-column select or relational query into a decoder-preserving scalar subquery. | [Scalar subqueries](features/sql/nested-subqueries.md) |
| `toSQL()`    | Coerce a JavaScript value or SQL wrapper into a typed, parameterized SQL expression.    | [Coerce values with `toSQL()`](features/sql/to-sql.md) |

### Universal SQL functions

These named exports work across PostgreSQL, MySQL, and SQLite and come from
`drizzle-plus`:

| Family            | Exports                                                                            | Guide                                                          |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Text              | `concatWithSeparator()`, `length()`, `lower()`, `substring()`, `trim()`, `upper()` | [Universal SQL functions](features/sql/universal-functions.md) |
| Numeric           | `abs()`, `ceil()`, `floor()`, `mod()`, `power()`, `round()`, `sqrt()`              | [Universal SQL functions](features/sql/universal-functions.md) |
| Null/current time | `coalesce()`, `nullif()`, `currentDate()`, `currentTime()`, `currentTimestamp()`   | [Universal SQL functions](features/sql/universal-functions.md) |
| Date decoding     | `SQLTimestamp`, `.toDate()` on timestamp expressions                               | [Timestamps as `Date`](features/sql/timestamps.md)             |

### Dialect-specific SQL functions

Import these named exports from the matching dialect root. The dialect
function guide owns the database-specific null behavior, argument order,
result decoding, and cast safety rules.

| Import                | Exports                                                                                                                                       | Guide                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `drizzle-plus/pg`     | `cast()`, `concat()`, `jsonAgg()`, `jsonAggNotNull()`, `jsonBuildObject()`, `position()`, `rowToJson()`, `uuidExtractTimestamp()`, `uuidv7()` | [Dialect-specific functions](features/sql/dialect-functions.md) |
| `drizzle-plus/mysql`  | `cast()`, `concat()`, `jsonArrayAgg()`, `jsonObject()`, `position()`                                                                          | [Dialect-specific functions](features/sql/dialect-functions.md) |
| `drizzle-plus/sqlite` | `cast()`, `concat()`, `instr()`, `jsonGroupArray()`, `jsonObject()`                                                                           | [Dialect-specific functions](features/sql/dialect-functions.md) |

## Utilities and type contracts

| Capability                 | Import or activation             | What it signals                                                                                                 | Guide                                                                 |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `orThrow()`                | `drizzle-plus/<dialect>/orThrow` | Reject an empty query result and narrow the awaited result to a non-null value.                                 | [Throw on empty results](features/utilities/or-throw.md)              |
| `mergeFindManyArgs()`      | `drizzle-plus`                   | Merge reusable relational query options, including one-level `columns`, `with`, `extras`, and relation filters. | [Merge query options](features/utilities/merge-queries.md)            |
| `mergeRelationsFilter()`   | `drizzle-plus`                   | Combine compatible relational `where` filters.                                                                  | [Merge query options](features/utilities/merge-queries.md)            |
| `toSelection()`            | `drizzle-plus`                   | Convert a reusable record of columns, SQL expressions, and JSON-safe values into a selection.                   | [Selections with `toSelection()`](features/utilities/to-selection.md) |
| Relational query inference | `drizzle-plus/types`             | Derive `findMany`/`findFirst` args, relation filters, relations, and ordering from a table query builder.       | [Relational query types](features/utilities/types.md)                 |
| SQL/query result inference | `drizzle-plus/types`             | Describe SQL inputs, nullability, query results, scalar subqueries, returning fields, and insert/update values. | [Relational query types](features/utilities/types.md)                 |
| JSON value contracts       | `drizzle-plus/types/json`        | Constrain values accepted as JSON-serializable selection or object input.                                       | [Selections with `$select()`](features/select/select.md)              |

The advanced `drizzle-plus/utils` entry point exposes low-level helpers for
selected fields, SQL and dialect extraction, relational query building,
decoder preservation, JSON object/array decoding, and selected-field ordering.
Use it when an integration needs those primitives rather than as a replacement
for the documented feature APIs.
