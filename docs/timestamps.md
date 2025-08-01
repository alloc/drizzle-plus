# Timestamps

Any `drizzle-plus` function that returns a timestamp will return a `SQLTimestamp` object, which extends the `SQL` class. Call the `toDate()` method to instruct Drizzle to parse it into a `Date` object (which is only relevant if the timestamp is used in a `select` or `returning` clause).

```ts
import { currentTimestamp } from 'drizzle-plus'

const now = currentTimestamp()
// => SQLTimestamp<string>

now.toDate()
// => SQL<Date>
```
