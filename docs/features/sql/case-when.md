# `caseWhen()` expressions

> Compose a SQL `CASE` expression incrementally while TypeScript collects the possible result types.

## Start a case expression

```ts
import { caseWhen } from 'drizzle-plus'

const status = caseWhen(user.active, 'active')
  .when(user.deletedAt, 'deleted')
  .else('inactive')

const rows = await db
  .select({
    id: user.id,
    status,
  })
  .from(user)
```

Each `when(condition, value)` adds a `WHEN ... THEN ...` branch. The condition
can be an SQL expression or `undefined`; an undefined condition is skipped,
which is useful when a branch is optional.

## Choose the fallback

Use `.else(value)` for an explicit fallback:

```ts
const label = caseWhen(user.age, 'known age').else('unknown')
```

Use `.elseNull()` when an unmatched row should produce SQL `NULL`:

```ts
const bucket = caseWhen(user.age, 'adult').elseNull()
```

If every condition is skipped, `.else(value)` returns the fallback directly
and `.elseNull()` returns `NULL`.

All branch values can be columns, SQL expressions, or values that Drizzle can
bind as parameters.
