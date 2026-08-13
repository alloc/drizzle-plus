# Decode database timestamps as `Date` values

> Keep database-generated date and timestamp expressions as SQL until selection, then opt into JavaScript `Date` decoding with `.toDate()`.

## Use current date and time

```ts
import { currentDate, currentTime, currentTimestamp } from 'drizzle-plus'

const now = currentTimestamp()
const today = currentDate()
const clock = currentTime()
```

`currentDate()` and `currentTimestamp()` return `SQLTimestamp` values. They
retain their SQL behavior and expose `.toDate()` for a selected or returned
field:

```ts
const rows = await db
  .select({
    today: currentDate().toDate(),
    now: currentTimestamp().toDate(),
    clock,
  })
  .from(user)
  .limit(1)
```

The first two fields decode as `Date | null` when the database returns a
non-nullable or nullable timestamp result as appropriate. `currentTime()`
returns the database's time-only string expression; it does not convert a time
without a date into a JavaScript `Date`. This example selects one existing row
from `user`; use [`fromSingle()`](../select/from-single.md) when the query does
not need a table source.

## Use the PostgreSQL UUID timestamp helper

PostgreSQL's `uuidExtractTimestamp()` also returns an `SQLTimestamp`, so the
same conversion is available for UUID v1 or v7 values:

```ts
import { uuidExtractTimestamp } from 'drizzle-plus/pg'

const createdAt = uuidExtractTimestamp(user.uuid).toDate()
```

## Check timezone behavior

The database decides whether `current_date`, `current_time`, and
`current_timestamp` use a local or UTC context. Check the database and driver
configuration when the exact timezone matters; drizzle-plus does not add a
timezone policy.
