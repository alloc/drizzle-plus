# Omit columns

> Derive a selection from a table while leaving out sensitive, large, or otherwise unnecessary columns.

## Enable it

```ts
import 'drizzle-plus/pg/$without'
// or 'drizzle-plus/mysql/$without'
// or 'drizzle-plus/sqlite/$without'
```

## Build a reduced selection

Call `$without()` on a table and pass the resulting column object to
`db.select()`:

```ts
const publicColumns = user.$without('passwordHash', 'resetToken')

const rows = await db.select(publicColumns).from(user)
```

The returned object contains every table column except the names you pass.
TypeScript also removes those keys from the selection type:

```ts
const columns = user.$without('passwordHash')
columns.id
// columns.passwordHash -> TypeScript error
```

This helper changes the selection only. It does not change the table schema,
access permissions, or the columns available to an update or insert.
