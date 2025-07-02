import { sql, SQL, Subquery } from 'drizzle-orm'
import { PgDialect, QueryBuilder, WithBuilder } from 'drizzle-orm/pg-core'

declare module 'drizzle-orm/pg-core' {
  interface QueryBuilder {
    /**
     * Similar to `$with()` but the CTE is materialized.
     *
     * Useful for ensuring a CTE is only executed once. The default behavior of
     * Postgres is to conditionally materialize the CTE based on certain
     * heuristics.
     *
     * @see https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION
     */
    $withMaterialized: WithBuilder
    /**
     * Similar to `$with()` but the CTE is **not** materialized.
     *
     * May improve performance by folding the CTE into its parent query. Only
     * allowed when the subquery is a `SELECT` with no use of volatile
     * functions.
     *
     * @see https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CTE-MATERIALIZATION
     */
    $withNotMaterialized: WithBuilder
  }
}

QueryBuilder.prototype.$withMaterialized = function (alias: string) {
  return withMaterialized(this.$with(alias), true)
}

QueryBuilder.prototype.$withNotMaterialized = function (alias: string) {
  return withMaterialized(this.$with(alias), false)
}

function withMaterialized(
  withBuilder: { as: (arg: any) => Subquery },
  materializeFlag: boolean
) {
  const originalMethod = withBuilder.as
  withBuilder.as = function (arg) {
    const subquery = originalMethod(arg)
    // @ts-expect-error: Custom property
    subquery._.materializeFlag = materializeFlag
    return subquery
  }
  return withBuilder
}

// @ts-expect-error: Rewrite internal method
PgDialect.prototype.buildWithCTE = function (
  queries: Subquery[] | undefined
): SQL | undefined {
  if (!queries?.length) return undefined

  const withSqlChunks = [sql`with `]
  for (const [i, w] of queries.entries()) {
    const materializeFlag = (w._ as any).materializeFlag
    const materializeKeyword =
      materializeFlag === true
        ? sql` materialized`
        : materializeFlag === false
          ? sql` not materialized`
          : sql.empty()

    withSqlChunks.push(
      sql`${sql.identifier(w._.alias)} as${materializeKeyword} (${w._.sql})`
    )
    if (i < queries.length - 1) {
      withSqlChunks.push(sql`, `)
    }
  }
  withSqlChunks.push(sql` `)
  return sql.join(withSqlChunks)
}
