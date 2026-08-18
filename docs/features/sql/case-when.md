# `caseWhen()` expressions

> Compose a SQL `CASE` expression incrementally while TypeScript collects the possible result types.

## Start a case expression

```ts
import { gt, isNotNull } from 'drizzle-orm'
import { caseWhen } from 'drizzle-plus'

const status = caseWhen(user.active, 'active')
  .when(isNotNull(user.deletedAt), 'deleted')
  .else('inactive')

const rows = await db
  .select({
    id: user.id,
    status,
  })
  .from(user)
```

Each `when(condition, value)` adds a `WHEN ... THEN ...` branch. The condition
must evaluate to a SQL boolean and can be `undefined`; an undefined condition
is skipped, which is useful when a branch is optional. Use helpers such as
`isNotNull()`, `eq()`, or `gt()` rather than passing a nullable or numeric
column directly.

## Choose the fallback

Use `.else(value)` for an explicit fallback:

```ts
const label = caseWhen(isNotNull(user.age), 'known age').else('unknown')
```

Use `.elseNull()` when an unmatched row should produce SQL `NULL`:

```ts
const bucket = caseWhen(gt(user.age, 17), 'adult').elseNull()
```

If every condition is skipped, `.else(value)` returns the fallback directly
and `.elseNull()` returns `NULL`.

All branch values can be columns, SQL expressions, or values that Drizzle can
bind as parameters.
