import { ColumnsSelection } from 'drizzle-orm'
import { QueryBuilder, WithBuilder } from 'drizzle-orm/pg-core'
import { setWithSubqueryFlags } from './internal'

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

QueryBuilder.prototype.$withMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return withMaterialized(this.$with(alias, selection!), {
    materialized: true,
  })
}

QueryBuilder.prototype.$withNotMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return withMaterialized(this.$with(alias, selection!), {
    materialized: false,
  })
}

function withMaterialized(
  withBuilder: ReturnType<WithBuilder>,
  flags: { materialized: boolean }
) {
  const originalMethod = withBuilder.as
  withBuilder.as = function (arg: any) {
    const subquery = originalMethod(arg)
    setWithSubqueryFlags(subquery, flags)
    return subquery
  }
  return withBuilder
}
