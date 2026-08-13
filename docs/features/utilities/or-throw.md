# Require a result with `orThrow()`

> Turn an empty query result into a `DrizzleError` while narrowing the awaited TypeScript result to a non-null value.

## Enable it

`orThrow()` is a query-promise extension, so import it once wherever query
promises are configured:

```ts
import 'drizzle-plus/orThrow'
```

## Require one row

```ts
const user = await db.query.user
  .findFirst({
    where: { id: 42 },
  })
  .orThrow()
```

If the query returns `undefined` or `null`, the promise rejects with the
default message `No rows returned`. If the query succeeds, the result is
narrowed so the caller does not need a second null check.

## Use a custom message

```ts
const user = await db.query.user
  .findFirst({
    where: { id: 42 },
  })
  .orThrow('User does not exist')
```

For an array query, `orThrow()` rejects only when the array is empty. It does
not reject a non-empty array just because some item contains nullable fields.

Use `findUnique()` when the important guarantee is that the filter names a
database uniqueness constraint; use `orThrow()` when the important guarantee
is that a result must exist.
