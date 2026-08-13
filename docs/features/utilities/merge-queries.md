# Merge query options

> Combine reusable relational query options and filters while keeping the resulting config checked by TypeScript.

## Merge `findMany()` configs

Use `mergeFindManyArgs()` when two parts of a query own different options:

```ts
import { mergeFindManyArgs } from 'drizzle-plus'

const base = {
  where: { active: true },
  columns: { id: true },
}

const page = {
  columns: { name: true },
  limit: 20,
}

const config = mergeFindManyArgs(base, page)
const rows = await db.query.user.findMany(config)
```

`columns`, `with`, and `extras` are merged one level deep. `where` is passed to
`mergeRelationsFilter()`. Other properties, such as `limit`, `offset`, and
`orderBy`, use the later config when both configs define them.

For the same behavior with table-specific autocomplete, use
[`$findMany()`](../query/query-composition.md), which validates each config
against `db.query.<table>` before returning it.

## Merge relation filters

Use `mergeRelationsFilter()` when only the `where` portion needs to be
combined:

```ts
import { mergeRelationsFilter } from 'drizzle-plus'

const filter = mergeRelationsFilter({ active: true }, { age: { gt: 18 } })

const rows = await db.query.user.findMany({ where: filter })
```

The helper keeps both filters type-compatible with Drizzle's relation filter
shape. `AND`, `OR`, `NOT`, and `RAW` combinations are preserved where the
helper can represent them; when the same ordinary key appears in both objects,
the later object supplies that key.
