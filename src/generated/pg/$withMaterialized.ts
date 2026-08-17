// @ts-nocheck
import { ColumnsSelection } from 'drizzle-orm'
import type * as V1 from 'drizzle-orm/_relations'
import { WithBuilder } from 'drizzle-orm/pg-core'
import { PgAsyncDatabase as Database } from 'drizzle-orm/pg-core/async/db'
import { AnyRelations, TablesRelationalConfig } from 'drizzle-orm/relations'
import { injectWithSubqueryAddons } from './internal'

declare module 'drizzle-orm/pg-core/async/db' {
  interface PgAsyncDatabase<
    TQueryResult extends import('drizzle-orm/pg-core').PgQueryResultHKT,
    TRelations extends AnyRelations,
  > {
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

Database.prototype.$withMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: true,
  })
}

Database.prototype.$withNotMaterialized = function (
  alias: string,
  selection?: ColumnsSelection
) {
  return injectWithSubqueryAddons(this.$with(alias, selection!), {
    materialized: false,
  })
}
