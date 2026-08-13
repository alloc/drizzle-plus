# Build recursive CTEs with `$withRecursive()`

> Create a `WITH RECURSIVE` query whose callback can reference the CTE while its result shape is being defined.

A common table expression (CTE) is a named query introduced by `WITH`. A
recursive CTE can also refer to its own rows, which makes it useful for trees,
graphs, and other data with repeated relationships.

## Enable it

```ts
import { eq, isNull } from 'drizzle-orm'
import 'drizzle-plus/pg/$withRecursive'
// or 'drizzle-plus/mysql/$withRecursive'
// or 'drizzle-plus/sqlite/$withRecursive'
```

## Define the recursive relation

The callback receives a typed reference to the CTE. Use that reference in the
recursive branch of the query, then pass the CTE to `db.with()`:

```ts
const tree = db.$withRecursive('category_tree').as(self =>
  db
    .select({
      id: category.id,
      parentId: category.parentId,
    })
    .from(category)
    .where(isNull(category.parentId))
    .unionAll(
      db
        .select({
          id: category.id,
          parentId: category.parentId,
        })
        .from(category)
        .innerJoin(self, eq(category.parentId, self.id))
    )
)

const rows = await db.with(tree).select().from(tree)
```

The example assumes `category` has `id` and `parentId` columns. The anchor and
recursive branches must return compatible columns, just as they would in
handwritten SQL.

## Help TypeScript infer the selection

The recursive self-reference can make the selection difficult to infer. If
TypeScript cannot determine the fields, declare the selection type at the
`.as<...>()` call and keep the anchor and recursive branches aligned.

`$withRecursive()` marks the CTE as recursive; the final query still needs
`db.with(tree)` before it can select from the relation.
