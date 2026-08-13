# Control PostgreSQL CTE materialization

> Tell PostgreSQL to materialize a CTE once or to keep it eligible for inlining when the planner would otherwise choose for you.

A common table expression (CTE) is a named query introduced by `WITH` and
used by the statement that follows.

## Enable it

This feature is PostgreSQL-only:

```ts
import { eq } from 'drizzle-orm'
import 'drizzle-plus/pg/$withMaterialized'
```

It adds `$withMaterialized()` and `$withNotMaterialized()` next to Drizzle's
`$with()` method.

## Materialize a CTE

Use `$withMaterialized()` when the CTE should be evaluated as its own result:

```ts
const activeUsers = db
  .$withMaterialized('active_users')
  .as(db.select({ id: user.id }).from(user).where(eq(user.active, true)))

const rows = await db.with(activeUsers).select().from(activeUsers)
```

## Prefer inlining

Use `$withNotMaterialized()` when the CTE should remain eligible for folding
into the parent query:

```ts
const activeUsers = db
  .$withNotMaterialized('active_users')
  .as(db.select({ id: user.id }).from(user).where(eq(user.active, true)))
```

Both methods use the same builder shape as `$with()`. They only change the
keyword emitted after the CTE's `AS` clause.

> [!WARNING]
> PostgreSQL restricts when `NOT MATERIALIZED` is valid, including restrictions on volatile functions. Check the PostgreSQL CTE rules before applying either override to a complex query.
