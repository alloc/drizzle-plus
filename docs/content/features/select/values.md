# Build `VALUES` relations with `$values()`

> Turn an in-memory list of rows into a typed SQL `VALUES` relation or CTE that can be selected, joined, or reused in a larger query.

A `VALUES` relation is a small, temporary table created from literal rows.

## Enable it

```ts
import 'drizzle-plus/pg/$values'
// or 'drizzle-plus/mysql/$values'
// or 'drizzle-plus/sqlite/$values'
```

## Use a values relation as a table

Pass rows with the same keys, then give the relation an alias:

```ts
const input = db.$values([
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
])
const inputUsers = input.as('input_users')

const rows = await db
  .select({ id: inputUsers.id, name: inputUsers.name })
  .from(inputUsers)
```

The fields on the aliased relation are inferred from the first row. The array
must not be empty, every row must use the same keys as the first row, and
`undefined` is not a valid cell value.

> [!IMPORTANT]
> Treat the first row as the shape declaration for the entire list. Inconsistent keys can produce invalid SQL or a result whose types do not describe the later rows.

## Put values in a CTE

Use `$withValues()` when the rows should be referenced as a common table
expression:

```ts
const inputUsers = db.$withValues('input_users', [{ id: 1 }, { id: 2 }])

const rows = await db.with(inputUsers).select().from(inputUsers)
```

The returned CTE exposes the same typed fields as the values list.

## Supply database types when inference is not enough

The optional second argument supplies SQL types for the first row. You can
also pass a table so its column types are reused:

```ts
const typedInput = db.$values([{ id: '1' }], { id: 'int4' })
```

The accepted type names depend on the dialect. Use a table when the values
should follow an existing schema column exactly.

## Inspect the generated SQL

`ValuesList` implements `getSQL()`, so you can inspect or compose its SQL
before giving it an alias. Call `inlineParams()` only when you deliberately
need literal parameters for debugging or a special SQL-building workflow.
