# Types

Here are some useful types that `drizzle-plus` provides:

```ts
// Universal types
import {
  InferWhereFilter,
  InferFindManyArgs,
  InferFindFirstArgs,
} from 'drizzle-plus/types'

// Pass the query builder to the type
type WhereFilter = InferWhereFilter<typeof db.query.foo>
type FindManyArgs = InferFindManyArgs<typeof db.query.foo>
type FindFirstArgs = InferFindFirstArgs<typeof db.query.foo>
```
