# Utility functions

The `drizzle-plus` package also has some functions that don't produce SQL expressions, but exist for various use cases.

- `mergeFindManyArgs`
  _Combines two configs for a `findMany` query._
- `mergeRelationsFilter`
  _Combines two `where` filters for the same table._

```ts
import { mergeFindManyArgs, mergeRelationsFilter } from 'drizzle-plus'
```
