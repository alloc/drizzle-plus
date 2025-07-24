import { ColumnsSelection } from 'drizzle-orm'
import {
  QueryBuilder,
  WithBuilder,
  WithSubqueryWithSelection,
} from 'drizzle-orm/pg-core'
import { TypedQueryBuilder } from 'drizzle-orm/query-builders/query-builder'
import { valuesList } from 'drizzle-plus'
import type { SelectionFromAnyObject } from './$select'
import { createWithSubquery } from './as'
import { injectWithSubqueryAddons, setWithSubqueryAddons } from './internal'

declare module 'drizzle-orm/pg-core' {
  interface QueryBuilder {
    $withValuesList: {
      <TAlias extends string, TRow extends Record<string, unknown>>(
        alias: TAlias,
        rows: TRow[]
      ): WithSubqueryWithSelection<SelectionFromAnyObject<TRow>, string>
    }
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
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: true,
  })
}

QueryBuilder.prototype.$withNotMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: false,
  })
}

QueryBuilder.prototype.$withValuesList = function (
  alias: string,
  rows: Record<string, unknown>[]
): any {
  const withSubquery = createWithSubquery(valuesList(rows), rows[0], alias)
  return setWithSubqueryAddons(withSubquery, {
    columns: Object.keys(rows[0]),
  })
}
