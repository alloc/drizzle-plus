# drizzle-plus

> Focused query-builder extensions and SQL helpers for Drizzle ORM.

`drizzle-plus` fills a few practical gaps around Drizzle's relational query
builder. Its extensions add methods such as `count()` and `updateMany()`;
its SQL helpers make common expressions and dialect-specific functions easier
to compose with TypeScript.

The package supports PostgreSQL, MySQL, and SQLite. Most query extensions are
enabled with a dialect-specific import, while shared SQL helpers come from the
root package.

## Start here

- [Getting started](getting-started.md) — install the package, enable an extension, and choose the right import path.
- [Agent reference](agent-reference.md) — inventory every capability and link to the guide that owns it.
- [Create rows](features/query/create.md) — insert one or more rows with typed results.
- [Upsert rows](features/query/upsert.md) — insert or update rows based on a primary key or unique constraint.
- [Build a paginated query](features/query/cursor-pagination.md) — derive the next-page filter from a cursor and sort order.
- [Compose a selection](features/query/query-composition.md) — build reusable, type-checked `findMany` configs.

## Features

### Query extensions

These methods extend `db.query.<table>`. Each page includes the import that
activates the method and the behavior to check before using it.

| Feature                                                      | Use it when                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| [Create](features/query/create.md)                           | You need an insert operation with optional duplicate skipping.         |
| [Upsert](features/query/upsert.md)                           | A conflict should update an existing row.                              |
| [Update many](features/query/update-many.md)                 | One update should affect multiple rows, optionally with a limit.       |
| [Count](features/query/count.md)                             | You need a filtered row count.                                         |
| [Find unique](features/query/find-unique.md)                 | The filter identifies one row through a unique key.                    |
| [Find many and count](features/query/find-many-and-count.md) | A list screen needs both page data and the total count.                |
| [Cursor pagination](features/query/cursor-pagination.md)     | You need stable pagination without hand-writing cursor filters.        |
| [Query composition](features/query/query-composition.md)     | You want to reuse and merge `findMany` options without executing them. |

### Database and select helpers

These helpers extend `db`, tables, or the select builder.

| Feature                                                   | Use it when                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`$select`](features/select/select.md)                    | A plain object should become a typed `db.select()` selection.           |
| [`$values`](features/select/values.md)                    | A small in-memory row set should become a SQL `VALUES` relation or CTE. |
| [Aliases](features/select/aliases.md)                     | A select or relational query needs to be used as a named subquery.      |
| [Recursive CTEs](features/select/recursive-ctes.md)       | A query needs to refer to its own result while it is being built.       |
| [Materialized CTEs](features/select/materialized-ctes.md) | PostgreSQL should materialize or inline a CTE explicitly.               |
| [`$without`](features/select/without-columns.md)          | A table's column selection should omit a few fields.                    |
| [`fromSingle()`](features/select/from-single.md)          | Optional joins must still produce one placeholder row.                  |
| [`withoutFrom()`](features/select/without-from.md)        | A select should contain expressions but no `FROM` clause.               |

### SQL building blocks

| Feature                                                         | Use it when                                                                  |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`caseWhen()`](features/sql/case-when.md)                       | A conditional SQL expression should remain type-aware.                       |
| [`nest()`](features/sql/nested-subqueries.md)                   | A one-column query should become a scalar SQL expression.                    |
| [`toSQL()`](features/sql/to-sql.md)                             | A JavaScript value should be safely bound as SQL input.                      |
| [Universal SQL functions](features/sql/universal-functions.md)  | You need common numeric, text, date, or null-handling functions.             |
| [Dialect-specific functions](features/sql/dialect-functions.md) | A database-specific JSON, UUID, cast, or string function is required.        |
| [Timestamps](features/sql/timestamps.md)                        | A database-generated date or timestamp should decode as a JavaScript `Date`. |

### Utilities and types

| Feature                                                    | Use it when                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`orThrow()`](features/utilities/or-throw.md)              | An empty query result should become an exception.                          |
| [Merge query options](features/utilities/merge-queries.md) | Reusable filters and selections need a type-safe merge.                    |
| [`toSelection()`](features/utilities/to-selection.md)      | A reusable plain object should become a select selection.                  |
| [Types](features/utilities/types.md)                       | A helper type should be derived from an existing relational query builder. |
