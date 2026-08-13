# Relational query types

> Reuse the argument, filter, ordering, and SQL-result types that Drizzle already inferred for a table.

## Import the type helpers

```ts
import type {
  InferFindFirstArgs,
  InferFindManyArgs,
  InferOrderBy,
  InferRelations,
  InferRelationsFilter,
} from 'drizzle-plus/types'
```

Pass a `db.query.<table>` builder to derive its types:

```ts
type UserFilter = InferRelationsFilter<typeof db.query.user>
type UserRelations = InferRelations<typeof db.query.user>
type UserOrderBy = InferOrderBy<typeof db.query.user>
type UserListArgs = InferFindManyArgs<typeof db.query.user>
type UserItemArgs = InferFindFirstArgs<typeof db.query.user>
```

These types are useful at application boundaries where a filter or query config
is assembled before the final database call:

```ts
function listUsers(where: UserFilter, orderBy?: UserOrderBy) {
  return db.query.user.findMany({ where, orderBy })
}
```

## Describe SQL inputs and results

The same module includes types for SQL helpers and scalar subqueries:

| Type                 | Use it for                                                       |
| -------------------- | ---------------------------------------------------------------- |
| `SQLValue<T>`        | A value or SQL expression that produces `T`.                     |
| `SQLExpression<T>`   | A column or SQL wrapper producing `T`.                           |
| `SQLResult<T>`       | The value returned by an expression, including nullable columns. |
| `QueryToResult<T>`   | The result shape of a select or query promise.                   |
| `QueryToSQL<T>`      | A query converted to a scalar SQL expression.                    |
| `ReturningClause<T>` | A typed `returning` selection for a table.                       |

Prefer these helpers when a utility accepts a Drizzle query object rather than
when a concrete application function can simply infer its parameters.
